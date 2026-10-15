import vine from '@vinejs/vine'
import { DISCOUNT_STATUSES, DISCOUNT_TYPES } from '#models/discount'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_DISCOUNTS_SORT_KEYS = ['title', 'startsAt', 'createdAt'] as const

export const adminDiscountsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_DISCOUNTS_SORT_KEYS),
  status: vine.enum(DISCOUNT_STATUSES).optional(),
  type: vine.enum(DISCOUNT_TYPES).optional(),
})
