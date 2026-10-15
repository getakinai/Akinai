export type PricingLine = {
  unitPrice: number
  quantity: number
  /** Defaults to true. */
  taxable?: boolean
}

export type PricingInput = {
  lines: PricingLine[]
  pricesIncludeTax: boolean
  /** Each line's share of the main discount, in line order; null for none. */
  lineDiscounts: number[] | null
  /** Taken off `shippingPrice` by a free shipping discount. */
  shippingDiscount: number
  shippingPrice: number | null
  tax: { rate: number; appliesToShipping: boolean } | null
}

export type PricingResult = {
  lineTotals: number[]
  subtotal: number
  discountTotal: number
  shippingDiscountTotal: number
  /** Shipping charged, after the shipping discount. */
  shippingTotal: number
  taxTotal: number
  total: number
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Order totals from already-resolved inputs. No database access, so the
 * draft service can price a quote before saving it.
 *
 * Tax is charged on each taxable line after its own share of the discount,
 * plus the shipping actually charged when the rate applies to it. When the
 * market's prices include tax, the tax is the part already inside those
 * amounts and the total is not increased.
 */
export default class OrderPricingService {
  price({
    lines,
    pricesIncludeTax,
    lineDiscounts,
    shippingDiscount,
    shippingPrice,
    tax,
  }: PricingInput): PricingResult {
    const lineTotals = lines.map(({ unitPrice, quantity }) => roundMoney(unitPrice * quantity))
    const subtotal = roundMoney(lineTotals.reduce((sum, value) => sum + value, 0))
    const discounts = lines.map((_, index) =>
      Math.min(Math.max(lineDiscounts?.[index] ?? 0, 0), lineTotals[index])
    )
    const discountTotal = roundMoney(discounts.reduce((sum, value) => sum + value, 0))
    const shippingBefore = roundMoney(shippingPrice ?? 0)
    const shippingDiscountTotal = roundMoney(
      Math.min(Math.max(shippingDiscount, 0), shippingBefore)
    )
    const shippingTotal = roundMoney(shippingBefore - shippingDiscountTotal)

    let taxTotal = 0
    if (tax && tax.rate > 0) {
      const taxableLines = lines.reduce(
        (sum, line, index) =>
          line.taxable === false ? sum : sum + lineTotals[index] - discounts[index],
        0
      )
      const taxable = taxableLines + (tax.appliesToShipping ? shippingTotal : 0)
      taxTotal = roundMoney(
        pricesIncludeTax ? (taxable * tax.rate) / (100 + tax.rate) : (taxable * tax.rate) / 100
      )
    }

    const total = roundMoney(
      subtotal - discountTotal + shippingTotal + (pricesIncludeTax ? 0 : taxTotal)
    )

    return {
      lineTotals,
      subtotal,
      discountTotal,
      shippingDiscountTotal,
      shippingTotal,
      taxTotal,
      total,
    }
  }
}
