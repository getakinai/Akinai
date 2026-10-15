import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_DRAFT_ORDERS_SORT_KEYS = ['number', 'total', 'createdAt'] as const

export const adminDraftOrdersListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_DRAFT_ORDERS_SORT_KEYS),
})
