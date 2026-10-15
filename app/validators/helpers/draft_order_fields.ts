import vine from '@vinejs/vine'

export const MAX_LINE_ITEMS = 100
export const MAX_LINE_QUANTITY = 9999

/**
 * Body shared by the draft calculate, store and update validators. Only the
 * shape is checked here; DraftOrderService checks that the variants,
 * customer, address, market, discount and shipping rate fit together and
 * reports problems on these same field names.
 */
export function draftOrderFields() {
  return {
    lineItems: vine
      .array(
        vine.object({
          variantId: vine.string().uuid(),
          quantity: vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_LINE_QUANTITY),
        })
      )
      .maxLength(MAX_LINE_ITEMS)
      .distinct('variantId'),
    customerId: vine.string().uuid().optional(),
    shippingAddressId: vine.string().uuid().optional(),
    marketId: vine.string().uuid().optional(),
    discountCode: vine.string().trim().toUpperCase().maxLength(64).optional(),
    shippingRateId: vine.string().uuid().optional(),
  }
}
