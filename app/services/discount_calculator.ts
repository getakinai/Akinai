import type {
  DiscountAppliesTo,
  DiscountBuyRequirement,
  DiscountType,
  DiscountValueType,
} from '#models/discount'
import type { DiscountTargetRole } from '#models/discount_target'
import { roundMoney } from '#services/order_pricing_service'

export type DiscountCartLine = {
  /** Null when the variant was deleted; such lines never match targets. */
  productId: string | null
  unitPrice: number
  quantity: number
}

export type DiscountRuleTarget = {
  role: DiscountTargetRole
  productId: string | null
  collectionId: string | null
}

/** The parts of a discount the calculator reads. */
export type DiscountRule = {
  type: DiscountType
  valueType: DiscountValueType
  value: number | null
  appliesTo: DiscountAppliesTo | null
  buyRequirement: DiscountBuyRequirement | null
  buyValue: number | null
  buyAppliesTo: DiscountAppliesTo | null
  getQuantity: number | null
  maxUsesPerOrder: number | null
  maxShippingPrice: number | null
  targets: DiscountRuleTarget[]
}

/** Product ids in each collection, limited to the products in the cart. */
export type CollectionMembership = Map<string, Set<string>>

export type DiscountApplication = {
  /** Taken off the lines; equals the sum of `lineAllocations`. */
  amount: number
  /** Each line's share of `amount`, in cart order. */
  lineAllocations: number[]
  /** Taken off the shipping price (free shipping discounts only). */
  shippingAmount: number
}

type Group = { line: number; price: number; count: number }

/**
 * Splits `amount` across `weights` in proportion, in cents, so the shares
 * add up to `amount` exactly (largest remainder gets the leftover cents).
 */
export function allocate(amount: number, weights: number[]): number[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const cents = Math.round(amount * 100)
  if (total <= 0 || cents <= 0) return weights.map(() => 0)

  const raw = weights.map((weight) => (cents * weight) / total)
  const shares = raw.map(Math.floor)
  let leftover = cents - shares.reduce((sum, share) => sum + share, 0)
  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
  for (const { index } of order) {
    if (leftover <= 0) break
    if (weights[index] <= 0) continue
    shares[index] += 1
    leftover -= 1
  }
  return shares.map((share) => share / 100)
}

/** `value` off `base`: a percentage of it, or a fixed amount capped at it. */
function amountOff(valueType: DiscountValueType, value: number, base: number): number {
  if (base <= 0) return 0
  const raw = valueType === 'percentage' ? (base * value) / 100 : value
  return roundMoney(Math.min(raw, base))
}

function matches(
  line: DiscountCartLine,
  rule: DiscountRule,
  role: DiscountTargetRole,
  membership: CollectionMembership
): boolean {
  const { productId } = line
  if (productId === null) return false
  return rule.targets.some((target) => {
    if (target.role !== role) return false
    if (target.productId !== null) return target.productId === productId
    if (target.collectionId !== null) {
      return membership.get(target.collectionId)?.has(productId) ?? false
    }
    return false
  })
}

const none = (lines: DiscountCartLine[]): DiscountApplication => ({
  amount: 0,
  lineAllocations: lines.map(() => 0),
  shippingAmount: 0,
})

function withAllocations(lineAllocations: number[]): DiscountApplication {
  const amount = roundMoney(lineAllocations.reduce((sum, value) => sum + value, 0))
  return { amount, lineAllocations, shippingAmount: 0 }
}

/**
 * Buy X get Y. Each use needs `buyValue` units (or that much spent) of the
 * `buy` targets and discounts up to `getQuantity` of the cheapest `get`
 * units. With a quantity requirement a unit counts toward only one side,
 * so "buy 2 get 1" on one product needs 3 in the cart.
 */
function buyXGetY(
  lines: DiscountCartLine[],
  rule: DiscountRule,
  membership: CollectionMembership
): DiscountApplication {
  const { buyRequirement, buyValue, getQuantity, value } = rule
  if (!buyRequirement || !buyValue || !getQuantity || value === null) return none(lines)

  // Work on line groups (not single units) so large quantities stay cheap.
  const buyOnly: Group[] = []
  const getOnly: Group[] = []
  const both: Group[] = []
  lines.forEach((line, index) => {
    const buy = matches(line, rule, 'buy', membership)
    const get = matches(line, rule, 'get', membership)
    const group = { line: index, price: line.unitPrice, count: line.quantity }
    if (buy && get) both.push(group)
    else if (buy) buyOnly.push(group)
    else if (get) getOnly.push(group)
  })

  const count = (groups: Group[]) => groups.reduce((sum, group) => sum + group.count, 0)
  const maxUses = rule.maxUsesPerOrder ?? Number.POSITIVE_INFINITY
  let getPool: Group[]
  let units: number

  if (buyRequirement === 'quantity') {
    const b = count(buyOnly)
    const x = count(both)
    const g = count(getOnly)
    // Units in both sets buy only after the buy-only units run out, and
    // the priciest of them buy so the cheapest are left to discount.
    const fits = (uses: number) => {
      const fromBoth = Math.max(0, uses * buyValue - b)
      return uses * buyValue <= b + x && g + x - fromBoth >= (uses - 1) * getQuantity + 1
    }
    let low = 0
    let high = Math.min(Math.floor((b + x) / buyValue), maxUses)
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (fits(mid)) low = mid
      else high = mid - 1
    }
    const uses = low
    if (uses === 0) return none(lines)

    let buyFromBoth = Math.max(0, uses * buyValue - b)
    const remainingBoth = [...both]
      .sort((a, c) => c.price - a.price)
      .map((group) => {
        const taken = Math.min(group.count, buyFromBoth)
        buyFromBoth -= taken
        return { ...group, count: group.count - taken }
      })
    getPool = [...getOnly, ...remainingBoth]
    units = uses * getQuantity
  } else {
    const spent = roundMoney(
      [...buyOnly, ...both].reduce((sum, group) => sum + group.price * group.count, 0)
    )
    const uses = Math.min(Math.floor(spent / buyValue), maxUses)
    getPool = [...getOnly, ...both]
    units = uses * getQuantity
  }

  const allocations = lines.map(() => 0)
  for (const group of getPool.sort((a, c) => a.price - c.price)) {
    if (units <= 0) break
    const taken = Math.min(group.count, units)
    units -= taken
    allocations[group.line] += amountOff(rule.valueType, value, group.price) * taken
  }
  return withAllocations(allocations.map(roundMoney))
}

/**
 * What `rule` takes off the cart. Eligibility (dates, minimum subtotal,
 * usage) is checked by the caller; this only does the arithmetic.
 */
export function applyDiscount(
  rule: DiscountRule,
  lines: DiscountCartLine[],
  shippingPrice: number | null,
  membership: CollectionMembership = new Map()
): DiscountApplication {
  const lineTotals = lines.map(({ unitPrice, quantity }) => roundMoney(unitPrice * quantity))

  switch (rule.type) {
    case 'amount_off_order': {
      if (rule.value === null) return none(lines)
      const subtotal = roundMoney(lineTotals.reduce((sum, value) => sum + value, 0))
      return withAllocations(allocate(amountOff(rule.valueType, rule.value, subtotal), lineTotals))
    }
    case 'amount_off_products': {
      if (rule.value === null) return none(lines)
      const weights = lines.map((line, index) =>
        matches(line, rule, 'applies', membership) ? lineTotals[index] : 0
      )
      const eligible = roundMoney(weights.reduce((sum, value) => sum + value, 0))
      return withAllocations(allocate(amountOff(rule.valueType, rule.value, eligible), weights))
    }
    case 'buy_x_get_y':
      return buyXGetY(lines, rule, membership)
    case 'free_shipping': {
      const free =
        shippingPrice !== null &&
        shippingPrice > 0 &&
        (rule.maxShippingPrice === null || shippingPrice <= rule.maxShippingPrice)
      return { ...none(lines), shippingAmount: free ? roundMoney(shippingPrice) : 0 }
    }
  }
}

/** Collection ids any target of `rules` points at. */
export function targetCollectionIds(rules: DiscountRule[]): string[] {
  const ids = new Set<string>()
  for (const rule of rules) {
    for (const target of rule.targets) if (target.collectionId) ids.add(target.collectionId)
  }
  return [...ids]
}
