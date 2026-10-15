import vine from '@vinejs/vine'
import { PAGE_STATUSES } from '#models/page'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_PAGES_SORT_KEYS = ['title', 'status', 'createdAt', 'updatedAt'] as const

export const adminPagesListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_PAGES_SORT_KEYS),
  status: vine.enum(PAGE_STATUSES).optional(),
})
