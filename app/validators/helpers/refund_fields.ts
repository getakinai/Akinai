import vine from '@vinejs/vine'
import { MAX_LINE_ITEMS, MAX_LINE_QUANTITY } from '#validators/helpers/draft_order_fields'

export const MAX_REFUND_AMOUNT = 1_000_000_000

/**
 * Lines and shipping of a refund. Only the shape is checked here;
 * RefundService checks the quantities and amounts against the order.
 */
export function refundLineFields() {
  return {
    lines: vine
      .array(
        vine.object({
          lineItemId: vine.string().uuid(),
          quantity: vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_LINE_QUANTITY),
        })
      )
      .maxLength(MAX_LINE_ITEMS)
      .distinct('lineItemId'),
    shipping: vine.number({ strict: true }).min(0).max(MAX_REFUND_AMOUNT).decimal([0, 2]),
  }
}
