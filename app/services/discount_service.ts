import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { errors } from '@vinejs/vine'
import Discount from '#models/discount'
import type {
  DiscountAppliesTo,
  DiscountBuyRequirement,
  DiscountMethod,
  DiscountType,
  DiscountValueType,
} from '#models/discount'
import DiscountRepository, {
  type DiscountData,
  type DiscountTargetData,
  type PaginateDiscountsData,
} from '#repositories/discount_repository'
import OrderRepository from '#repositories/order_repository'
import AuditLogService from '#services/audit_log_service'
import {
  applyDiscount,
  targetCollectionIds,
  type CollectionMembership,
  type DiscountApplication,
  type DiscountCartLine,
} from '#services/discount_calculator'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListDiscountsFilters = Partial<PaginateDiscountsData>

export type DiscountInput = {
  title: string
  /** Defaults to `amount_off_order`. */
  type?: DiscountType
  code?: string | null
  method: DiscountMethod
  valueType?: DiscountValueType
  value?: number
  appliesTo?: DiscountAppliesTo
  productIds?: string[]
  collectionIds?: string[]
  buyRequirement?: DiscountBuyRequirement
  buyValue?: number
  buyAppliesTo?: DiscountAppliesTo
  buyProductIds?: string[]
  buyCollectionIds?: string[]
  getQuantity?: number
  maxUsesPerOrder?: number | null
  maxShippingPrice?: number | null
  minSubtotal: number | null
  usageLimit: number | null
  oncePerCustomer: boolean
  startsAt: DateTime
  endsAt: DateTime | null
}

export type CartDiscountInput = {
  code?: string | null
  lines: DiscountCartLine[]
  /** Line subtotal before discounts. */
  subtotal: number
  /** The chosen shipping rate's price, or null before one is chosen. */
  shippingPrice: number | null
  customerId: string | null
  /** Storefront checkout applies automatic discounts; staff drafts don't. */
  applyAutomatic: boolean
}

export type AppliedDiscount = { discount: Discount; application: DiscountApplication }

export type CartDiscounts = {
  /** Amount off order, amount off products or Buy X get Y. */
  main: AppliedDiscount | null
  /** Free shipping. */
  shipping: AppliedDiscount | null
  /** Why the entered code was rejected, or null. */
  codeError: string | null
}

const INVALID_CODE = 'This code isn’t valid for this order'

function validation(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'discount' }])
}

@inject()
export default class DiscountService {
  constructor(
    protected discountRepository: DiscountRepository,
    protected orderRepository: OrderRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListDiscountsFilters = {}) {
    return this.discountRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      type: filters.type,
      sort: filters.sort ?? 'createdAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async findOrFail(id: string): Promise<Discount> {
    return this.discountRepository.findOrFail(id)
  }

  /** The discount with its targets, or null when it was deleted. */
  async find(id: string): Promise<Discount | null> {
    return this.discountRepository.find(id)
  }

  async create(input: DiscountInput): Promise<Discount> {
    const targets = await this.checkedTargets(input)
    return this.discountRepository.create(toData(input), targets)
  }

  /** The type is fixed once created; a different `type` is rejected. */
  async update(discount: Discount, input: DiscountInput): Promise<Discount> {
    if (input.type && input.type !== discount.type) {
      validation('type', 'The discount type can’t be changed')
    }
    const typed = { ...input, type: discount.type }
    const targets = await this.checkedTargets(typed)
    return this.discountRepository.update(discount, toData(typed), targets)
  }

  async archive(discount: Discount): Promise<Discount> {
    return this.discountRepository.setArchivedAt(discount, DateTime.now())
  }

  async unarchive(discount: Discount): Promise<Discount> {
    return this.discountRepository.setArchivedAt(discount, null)
  }

  /**
   * Archives or unarchives many discounts at once. Ones already in that
   * state are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const archivedAt = archived ? DateTime.now() : null
    const changed = await this.discountRepository.setArchivedAtMany(ids, archivedAt)
    await this.auditLogService.recordBulkUpdate(Discount, changed, { archivedAt })
    return bulkResult(ids, changed)
  }

  /**
   * The active code discount for `code` whose minimum subtotal the order
   * meets, or null. Codes match case-insensitively.
   */
  async findApplicableByCode(
    code: string,
    subtotal: number,
    at: DateTime = DateTime.now()
  ): Promise<Discount | null> {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return null

    const discount = await this.discountRepository.findActiveByCode(normalized, at)
    if (!discount) return null
    if (discount.minSubtotal !== null && subtotal < discount.minSubtotal) return null
    return discount
  }

  /**
   * Amount an amount-off-order discount takes off a subtotal, rounded to
   * cents and never more than the subtotal.
   */
  amountFor(discount: { valueType: DiscountValueType; value: number }, subtotal: number): number {
    if (subtotal <= 0) return 0
    const raw =
      discount.valueType === 'percentage' ? (subtotal * discount.value) / 100 : discount.value
    return Math.round(Math.min(raw, subtotal) * 100) / 100
  }

  /**
   * The discounts for a cart: one main discount (order, products or Buy X
   * get Y) and one free shipping discount. The entered code fills the slot
   * of its type; when `applyAutomatic` is set, each empty slot takes the
   * eligible automatic discount that saves the most.
   */
  async resolveForCart(input: CartDiscountInput): Promise<CartDiscounts> {
    const at = DateTime.now()
    const code = input.code?.trim().toUpperCase() || null
    const [codeDiscount, automatic] = await Promise.all([
      code ? this.discountRepository.findActiveByCode(code, at) : null,
      input.applyAutomatic ? this.discountRepository.activeAutomatic(at) : [],
    ])

    const meetsMinimum = (discount: Discount) =>
      discount.minSubtotal === null || input.subtotal >= discount.minSubtotal
    const candidates = [codeDiscount, ...automatic].filter(
      (discount): discount is Discount => discount !== null && meetsMinimum(discount)
    )

    const onceIds = candidates.filter((d) => d.oncePerCustomer).map((d) => d.id)
    const productIds = [
      ...new Set(input.lines.flatMap(({ productId }) => (productId ? [productId] : []))),
    ]
    const [used, membership] = await Promise.all([
      input.customerId && onceIds.length > 0
        ? this.orderRepository.discountsUsedByCustomer(input.customerId, onceIds)
        : new Set<string>(),
      this.discountRepository.collectionMembership(targetCollectionIds(candidates), productIds),
    ])

    const apply = (discount: Discount): AppliedDiscount => ({
      discount,
      application: applyDiscount(discount, input.lines, input.shippingPrice, membership),
    })

    let main: AppliedDiscount | null = null
    let shipping: AppliedDiscount | null = null
    let codeError: string | null = null

    if (code) {
      if (!codeDiscount || !meetsMinimum(codeDiscount)) {
        codeError = INVALID_CODE
      } else if (used.has(codeDiscount.id)) {
        codeError = 'This customer has already used this discount'
      } else {
        const applied = apply(codeDiscount)
        if (codeDiscount.isShipping) {
          if (input.shippingPrice !== null && applied.application.shippingAmount === 0) {
            codeError = 'This code doesn’t cover the chosen shipping rate'
          } else {
            shipping = applied
          }
        } else if (applied.application.amount === 0) {
          codeError = 'This code doesn’t apply to the items in your cart'
        } else {
          main = applied
        }
      }
    }

    const best = (pool: Discount[], saving: (applied: AppliedDiscount) => number) =>
      pool
        .filter((discount) => !used.has(discount.id))
        .map(apply)
        .filter((applied) => saving(applied) > 0)
        .sort((a, b) => saving(b) - saving(a))[0] ?? null

    if (!main) {
      main = best(
        automatic.filter((d) => !d.isShipping && meetsMinimum(d)),
        ({ application }) => application.amount
      )
    }
    if (!shipping) {
      shipping = best(
        automatic.filter((d) => d.isShipping && meetsMinimum(d)),
        ({ application }) => application.shippingAmount
      )
    }

    return { main, shipping, codeError }
  }

  /**
   * The main discount re-applied to a placed order being edited. The
   * minimum and active dates aren't re-checked: the order already earned it.
   */
  async reapply(
    discount: Discount,
    lines: DiscountCartLine[],
    shippingPrice: number | null
  ): Promise<DiscountApplication> {
    const productIds = [
      ...new Set(lines.flatMap(({ productId }) => (productId ? [productId] : []))),
    ]
    const membership: CollectionMembership = await this.discountRepository.collectionMembership(
      targetCollectionIds([discount]),
      productIds
    )
    return applyDiscount(discount, lines, shippingPrice, membership)
  }

  /**
   * The targets a type uses, checked to exist. Types without targets get
   * none, whatever was sent.
   */
  protected async checkedTargets(input: DiscountInput): Promise<DiscountTargetData[]> {
    const sides: {
      role: DiscountTargetData['role']
      appliesTo: DiscountAppliesTo | undefined
      productIds: string[]
      collectionIds: string[]
      productField: string
      collectionField: string
    }[] = []
    if (input.type === 'amount_off_products') {
      sides.push({
        role: 'applies',
        appliesTo: input.appliesTo,
        productIds: input.productIds ?? [],
        collectionIds: input.collectionIds ?? [],
        productField: 'productIds',
        collectionField: 'collectionIds',
      })
    } else if (input.type === 'buy_x_get_y') {
      sides.push(
        {
          role: 'buy',
          appliesTo: input.buyAppliesTo,
          productIds: input.buyProductIds ?? [],
          collectionIds: input.buyCollectionIds ?? [],
          productField: 'buyProductIds',
          collectionField: 'buyCollectionIds',
        },
        {
          role: 'get',
          appliesTo: input.appliesTo,
          productIds: input.productIds ?? [],
          collectionIds: input.collectionIds ?? [],
          productField: 'productIds',
          collectionField: 'collectionIds',
        }
      )
    }

    const targets: DiscountTargetData[] = []
    for (const side of sides) {
      const byProduct = side.appliesTo === 'products'
      const ids = byProduct ? side.productIds : side.collectionIds
      const field = byProduct ? side.productField : side.collectionField
      if (ids.length === 0) {
        validation(
          field,
          byProduct ? 'Choose at least one product' : 'Choose at least one collection'
        )
      }
      const found = await this.discountRepository.countExistingTargets(
        byProduct ? ids : [],
        byProduct ? [] : ids
      )
      if ((byProduct ? found.products : found.collections) !== ids.length) {
        validation(field, 'Some of the chosen items no longer exist')
      }
      for (const id of ids) {
        targets.push({
          role: side.role,
          productId: byProduct ? id : null,
          collectionId: byProduct ? null : id,
        })
      }
    }
    return targets
  }
}

function toData(input: DiscountInput): DiscountData {
  const type = input.type ?? 'amount_off_order'
  const usesValue = type !== 'free_shipping'
  const usesTargets = type === 'amount_off_products' || type === 'buy_x_get_y'
  const bxgy = type === 'buy_x_get_y'
  return {
    title: input.title,
    type,
    code: input.method === 'code' && input.code ? input.code.toUpperCase() : null,
    method: input.method,
    valueType: usesValue ? (input.valueType ?? 'percentage') : 'percentage',
    value: usesValue ? (input.value ?? null) : null,
    appliesTo: usesTargets ? (input.appliesTo ?? null) : null,
    buyRequirement: bxgy ? (input.buyRequirement ?? null) : null,
    buyValue: bxgy ? (input.buyValue ?? null) : null,
    buyAppliesTo: bxgy ? (input.buyAppliesTo ?? null) : null,
    getQuantity: bxgy ? (input.getQuantity ?? null) : null,
    maxUsesPerOrder: bxgy ? (input.maxUsesPerOrder ?? null) : null,
    maxShippingPrice: type === 'free_shipping' ? (input.maxShippingPrice ?? null) : null,
    minSubtotal: input.minSubtotal,
    usageLimit: input.usageLimit,
    oncePerCustomer: input.oncePerCustomer,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  }
}
