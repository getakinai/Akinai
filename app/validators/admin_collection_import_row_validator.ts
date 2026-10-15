import vine from '@vinejs/vine'
import { COLLECTION_MATCHES, COLLECTION_SORT_ORDERS, COLLECTION_TYPES } from '#models/collection'
import { seoImportFields } from '#validators/helpers/seo_fields'

/**
 * One row of a collection import CSV. Empty cells read as omitted. The
 * `rules` cell (one rule per line) is parsed and checked by
 * CollectionCsvService.
 */
export const adminCollectionImportRowValidator = vine.create({
  handle: vine
    .string()
    .trim()
    .toLowerCase()
    .minLength(1)
    .maxLength(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: vine.string().trim().minLength(1).maxLength(255),
  description: vine.string().trim().maxLength(10_000).optional(),
  status: vine.enum(['draft', 'active'] as const).optional(),
  type: vine.enum(COLLECTION_TYPES),
  match: vine.enum(COLLECTION_MATCHES).optional(),
  sort_order: vine.enum(COLLECTION_SORT_ORDERS).optional(),
  ...seoImportFields(),
  rules: vine.string().trim().maxLength(20_000).optional(),
})
