import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_VENDORS_SORT_KEYS = ['name', 'productsCount', 'createdAt'] as const

export const adminVendorsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_VENDORS_SORT_KEYS),
  status: vine.enum(['active', 'archived'] as const).optional(),
})
