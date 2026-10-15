import vine from '@vinejs/vine'
import { RETURN_REASONS } from '#models/order_return'
import { MAX_LINE_QUANTITY } from '#validators/helpers/draft_order_fields'

export const MAX_RETURN_LINES = 50

/** A customer's return request. Owner ids are never accepted; the order comes from the route. */
export const customersOrderReturnStoreValidator = vine.create({
  lines: vine
    .array(
      vine.object({
        orderLineItemId: vine.string().uuid(),
        quantity: vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_LINE_QUANTITY),
        reason: vine.enum(RETURN_REASONS),
        note: vine.string().trim().maxLength(500).nullable().optional(),
      })
    )
    .minLength(1)
    .maxLength(MAX_RETURN_LINES)
    .distinct('orderLineItemId'),
  note: vine.string().trim().maxLength(1000).nullable().optional(),
})
