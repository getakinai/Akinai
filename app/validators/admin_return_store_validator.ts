import vine from '@vinejs/vine'
import { RETURN_REASONS } from '#models/order_return'
import { MAX_LINE_QUANTITY } from '#validators/helpers/draft_order_fields'
import { MAX_RETURN_LINES } from '#validators/customers_order_return_store_validator'

/** A return staff create for an order (e.g. after a phone or email request). */
export const adminReturnStoreValidator = vine.create({
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
