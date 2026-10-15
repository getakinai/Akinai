import vine from '@vinejs/vine'
import { COLLECTION_STATUSES, COLLECTION_TYPES } from '#models/collection'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_COLLECTIONS_SORT_KEYS = ['title', 'status', 'createdAt', 'updatedAt'] as const

export const adminCollectionsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_COLLECTIONS_SORT_KEYS),
  status: vine.enum(COLLECTION_STATUSES).optional(),
  type: vine.enum(COLLECTION_TYPES).optional(),
})
