import vine from '@vinejs/vine'
import { ORDER_FULFILLMENT_STATUSES, ORDER_PAYMENT_STATUSES } from '#models/order'

/** Optional starting filters for the orders list (e.g. links from the dashboard). */
export const adminOrdersHomeQueryValidator = vine.create({
  paymentStatus: vine.enum(ORDER_PAYMENT_STATUSES).optional(),
  fulfillmentStatus: vine.enum(ORDER_FULFILLMENT_STATUSES).optional(),
})
