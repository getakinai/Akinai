import vine from '@vinejs/vine'
import { MANUAL_FULFILLMENT_STATUSES } from '#models/order'

export const adminOrderFulfillmentStatusUpdateValidator = vine.create({
  status: vine.enum(MANUAL_FULFILLMENT_STATUSES),
})
