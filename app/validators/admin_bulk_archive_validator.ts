import vine from '@vinejs/vine'
import { bulkIdsSchema } from '#validators/helpers/bulk_ids'

/**
 * Archive (`archived: true`) or unarchive many records of one resource.
 */
export const adminBulkArchiveValidator = vine.create({
  ids: bulkIdsSchema(),
  archived: vine.boolean({ strict: true }),
})
