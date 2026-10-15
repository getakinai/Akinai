import vine from '@vinejs/vine'
import { RETURN_STATUSES } from '#models/order_return'

/** Optional starting status filter (e.g. the dashboard's "returns to review" link). */
export const adminReturnsHomeQueryValidator = vine.create({
  status: vine.enum(RETURN_STATUSES).optional(),
})
