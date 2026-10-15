import vine from '@vinejs/vine'
import { ORDER_FULFILLMENT_STATUSES, ORDER_PAYMENT_STATUSES } from '#models/order'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_ORDERS_SORT_KEYS = ['number', 'total', 'createdAt'] as const

export const adminOrdersListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_ORDERS_SORT_KEYS),
  paymentStatus: vine.enum(ORDER_PAYMENT_STATUSES).optional(),
  fulfillmentStatus: vine.enum(ORDER_FULFILLMENT_STATUSES).optional(),
  // Query-string values arrive as text, so numbers/booleans are coerced (bounded below).
  archived: vine.boolean().optional(),
  customerId: vine.string().uuid().optional(),
})
