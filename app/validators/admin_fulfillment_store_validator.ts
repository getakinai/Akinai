import vine from '@vinejs/vine'
import { MAX_LINE_ITEMS, MAX_LINE_QUANTITY } from '#validators/helpers/draft_order_fields'
import { fulfillmentTrackingFields } from '#validators/helpers/fulfillment_tracking_fields'

export const adminFulfillmentStoreValidator = vine.create({
  lineItems: vine
    .array(
      vine.object({
        lineItemId: vine.string().uuid(),
        quantity: vine.number({ strict: true }).withoutDecimals().min(1).max(MAX_LINE_QUANTITY),
      })
    )
    .minLength(1)
    .maxLength(MAX_LINE_ITEMS)
    .distinct('lineItemId'),
  ...fulfillmentTrackingFields(),
  notifyCustomer: vine.boolean({ strict: true }).optional(),
})
