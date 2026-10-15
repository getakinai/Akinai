import vine from '@vinejs/vine'
import { RETURN_STATUSES } from '#models/order_return'
import { listQuerySchema } from '#validators/helpers/list_query'

export const adminReturnsListQueryValidator = vine.create({
  ...listQuerySchema(['createdAt'] as const),
  status: vine.enum(RETURN_STATUSES).optional(),
})
