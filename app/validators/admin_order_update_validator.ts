import vine from '@vinejs/vine'
import { MANUAL_PAYMENT_STATUSES } from '#models/order'
import { MAX_LINE_ITEMS, MAX_LINE_QUANTITY } from '#validators/helpers/draft_order_fields'

/**
 * A line is either an existing line item (`lineItemId`, keeps its saved
 * price) or a newly added variant (`variantId`, priced at its current price).
 */
export const adminOrderUpdateValidator = vine.create({
  paymentStatus: vine.enum(MANUAL_PAYMENT_STATUSES),
  lineItems: vine
    .array(
      vine.object({
        lineItemId: vine.string().uuid().optional(),
        variantId: vine.string().uuid().optional().requiredIfMissing('lineItemId'),
        quantity: vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_LINE_QUANTITY),
      })
    )
    .minLength(1)
    .maxLength(MAX_LINE_ITEMS),
  totalOverride: vine.number({ strict: true }).min(0).max(9_999_999_999).decimal([0, 2]).nullable(),
  totalOverrideReason: vine
    .string()
    .trim()
    .maxLength(255)
    .nullable()
    .optional()
    .requiredIfExists('totalOverride'),
})
