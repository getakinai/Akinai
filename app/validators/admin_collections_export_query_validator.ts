import vine from '@vinejs/vine'
import { COLLECTION_STATUSES, COLLECTION_TYPES } from '#models/collection'
import { ADMIN_COLLECTIONS_SORT_KEYS } from '#validators/admin_collections_list_query_validator'
import { exportQuerySchema } from '#validators/helpers/list_query'

export const adminCollectionsExportQueryValidator = vine.create({
  ...exportQuerySchema(ADMIN_COLLECTIONS_SORT_KEYS),
  status: vine.enum(COLLECTION_STATUSES).optional(),
  type: vine.enum(COLLECTION_TYPES).optional(),
})
