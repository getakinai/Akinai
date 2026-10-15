import vine from '@vinejs/vine'
import { PRODUCT_STATUSES } from '#models/product'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_PRODUCTS_SORT_KEYS = ['title', 'status', 'createdAt', 'updatedAt'] as const

export const adminProductsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_PRODUCTS_SORT_KEYS),
  status: vine.enum(PRODUCT_STATUSES).optional(),
})
