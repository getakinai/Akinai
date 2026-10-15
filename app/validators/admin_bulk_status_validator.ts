import vine from '@vinejs/vine'
import { bulkIdsSchema } from '#validators/helpers/bulk_ids'

/**
 * Publish (`active`) or unpublish (`draft`) many records of a resource with
 * a draft/active/archived status.
 */
export const adminBulkStatusValidator = vine.create({
  ids: bulkIdsSchema(),
  status: vine.enum(['draft', 'active'] as const),
})
