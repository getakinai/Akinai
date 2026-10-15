import vine from '@vinejs/vine'
import { COLLECTION_MATCHES, COLLECTION_SORT_ORDERS } from '#models/collection'
import {
  COLLECTION_RULE_FIELDS,
  COLLECTION_RULE_OPERATORS_LIST,
  MAX_COLLECTION_RULES,
} from '#models/collection_rule'
import { seoFields } from '#validators/helpers/seo_fields'

/**
 * Field/operator pairing and values are checked by CollectionService.
 */
export const collectionRulesSchema = () =>
  vine
    .array(
      vine.object({
        field: vine.enum(COLLECTION_RULE_FIELDS),
        operator: vine.enum(COLLECTION_RULE_OPERATORS_LIST),
        value: vine.string().trim().maxLength(255).nullable(),
      })
    )
    .maxLength(MAX_COLLECTION_RULES)

export const collectionFields = () => ({
  title: vine.string().trim().minLength(1).maxLength(255),
  description: vine.string().trim().maxLength(10_000).nullable(),
  status: vine.enum(['draft', 'active'] as const),
  match: vine.enum(COLLECTION_MATCHES).optional(),
  sortOrder: vine.enum(COLLECTION_SORT_ORDERS).optional(),
  slug: vine.string().trim().maxLength(255).nullable().optional(),
  ...seoFields(),
  rules: collectionRulesSchema().optional(),
})
