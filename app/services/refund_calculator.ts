import { roundMoney } from '#utils/money'

export type RefundCalcOrder = {
  subtotal: number
  discountTotal: number
  shippingTotal: number
  pricesIncludeTax: boolean
  taxRate: number | null
  taxAppliesToShipping: boolean
  /** What can still be refunded (total paid minus refunds issued). */
  refundableTotal: number
}

export type RefundCalcLine = {
  id: string
  unitPrice: number
  quantity: number
  refundedQuantity: number
  taxable: boolean
  /** The line's share of the order discount; 0 on orders priced before allocations. */
  discountAllocation: number
}

export type RefundCalcInput = {
  lines: { lineItemId: string; quantity: number }[]
  /** Shipping to refund, before tax. */
  shipping: number
  /** Shipping already refunded by earlier refunds, before tax. */
  refundedShipping: number
}

export type RefundCalcResult = {
  lines: { lineItemId: string; quantity: number; amount: number }[]
  shipping: number
  subtotal: number
  tax: number
  /** Suggested refund: the lines plus shipping and tax, capped at `maximum`. */
  total: number
  /** Most that may be refunded on this order right now. */
  maximum: number
  /** Shipping that can still be refunded, before tax. */
  shippingRefundable: number
}

export class RefundCalculationError extends Error {
  constructor(
    readonly field: string,
    message: string
  ) {
    super(message)
  }
}

/**
 * Refund amounts from the order's saved prices. Pure, so it can be unit
 * tested and run inside the refund transaction.
 *
 * Each unit is refunded at its price after its line's share of the order
 * discount. Orders priced before lines stored their share fall back to
 * splitting the discount in proportion to line totals. Tax is added on top
 * only when prices exclude tax; included tax is already inside the price.
 */
export function calculateRefund(
  order: RefundCalcOrder,
  orderLines: RefundCalcLine[],
  input: RefundCalcInput
): RefundCalcResult {
  const rate = order.taxRate && order.taxRate > 0 ? order.taxRate : 0
  const addsTax = rate > 0 && !order.pricesIncludeTax
  const allocated = orderLines.some((line) => line.discountAllocation > 0)
  const discountShare = !allocated && order.subtotal > 0 ? order.discountTotal / order.subtotal : 0
  const linesById = new Map(orderLines.map((line) => [line.id, line]))

  let subtotal = 0
  let tax = 0
  const lines = input.lines.map(({ lineItemId, quantity }, index) => {
    const line = linesById.get(lineItemId)
    if (!line) {
      throw new RefundCalculationError(`lines.${index}.lineItemId`, 'This item is not on the order')
    }
    const left = line.quantity - line.refundedQuantity
    if (quantity > left) {
      throw new RefundCalculationError(
        `lines.${index}.quantity`,
        left === 0 ? 'This item is already refunded' : `Only ${left} can still be refunded`
      )
    }
    const unitDiscount = allocated
      ? line.discountAllocation / line.quantity
      : line.unitPrice * discountShare
    const net = (line.unitPrice - unitDiscount) * quantity
    const lineTax = addsTax && line.taxable ? (net * rate) / 100 : 0
    subtotal += net
    tax += lineTax
    return { lineItemId, quantity, amount: roundMoney(net + lineTax) }
  })

  const shippingRefundable = roundMoney(Math.max(order.shippingTotal - input.refundedShipping, 0))
  if (input.shipping > shippingRefundable) {
    throw new RefundCalculationError(
      'shipping',
      `Only ${shippingRefundable.toFixed(2)} of shipping can still be refunded`
    )
  }
  const shipping = roundMoney(input.shipping)
  subtotal += shipping
  if (addsTax && order.taxAppliesToShipping) tax += (shipping * rate) / 100

  const maximum = roundMoney(Math.max(order.refundableTotal, 0))
  const total = Math.min(roundMoney(subtotal + tax), maximum)

  return {
    lines,
    shipping,
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
    total,
    maximum,
    shippingRefundable,
  }
}
