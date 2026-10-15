import vine from '@vinejs/vine'
import { CATALOG_CURSOR_MAX_LENGTH } from '#constants/storefront'

export const storefrontProductReviewsQueryValidator = vine.create({
  cursor: vine.string().trim().maxLength(CATALOG_CURSOR_MAX_LENGTH).optional(),
})
