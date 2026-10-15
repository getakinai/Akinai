import vine from '@vinejs/vine'
import { fulfillmentTrackingFields } from '#validators/helpers/fulfillment_tracking_fields'

export const adminFulfillmentTrackingUpdateValidator = vine.create({
  ...fulfillmentTrackingFields(),
  notifyCustomer: vine.boolean({ strict: true }).optional(),
})
