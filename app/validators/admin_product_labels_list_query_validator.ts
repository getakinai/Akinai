import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_PRODUCT_LABELS_SORT_KEYS = ['name', 'productsCount', 'createdAt'] as const

export const adminProductLabelsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_PRODUCT_LABELS_SORT_KEYS),
  status: vine.enum(['active', 'archived'] as const).optional(),
})
