import vine from '@vinejs/vine'
import {
  CATALOG_CURSOR_MAX_LENGTH,
  STOREFRONT_COLLECTION_SORTS,
  STOREFRONT_FILTER_MAX_IDS,
  STOREFRONT_FILTER_MAX_OPTIONS,
  STOREFRONT_FILTER_MAX_PRICE,
} from '#constants/storefront'

const price = () => vine.number().min(0).max(STOREFRONT_FILTER_MAX_PRICE).optional()

const ids = () =>
  vine.array(vine.string().trim().uuid()).maxLength(STOREFRONT_FILTER_MAX_IDS).optional()

export const storefrontCollectionProductsQueryValidator = vine.create({
  cursor: vine.string().trim().maxLength(CATALOG_CURSOR_MAX_LENGTH).optional(),
  // Query-string values arrive as text, so numbers/booleans are coerced (bounded below).
  sort: vine.enum(STOREFRONT_COLLECTION_SORTS).optional(),
  direction: vine.enum(['asc', 'desc'] as const).optional(),
  priceMin: price(),
  priceMax: price(),
  vendor: ids(),
  type: ids(),
  /** `<option name>:<value>`, split on the first colon. */
  option: vine
    .array(
      vine
        .string()
        .trim()
        .minLength(3)
        .maxLength(129)
        .regex(/^[^:]{1,64}:.{1,64}$/)
    )
    .maxLength(STOREFRONT_FILTER_MAX_OPTIONS)
    .optional(),
  inStock: vine.boolean().optional(),
})
