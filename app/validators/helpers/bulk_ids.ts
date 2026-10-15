import vine from '@vinejs/vine'

export const MAX_BULK_IDS = 100

/**
 * The records a bulk action applies to.
 */
export const bulkIdsSchema = () =>
  vine.array(vine.string().uuid()).minLength(1).maxLength(MAX_BULK_IDS).distinct()
