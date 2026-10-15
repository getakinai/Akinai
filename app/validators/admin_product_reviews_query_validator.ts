import vine from '@vinejs/vine'
import { PER_PAGE_OPTIONS } from '#validators/helpers/list_query'

export const adminProductReviewsQueryValidator = vine.create({
  // Query-string values arrive as text, so numbers/booleans are coerced (bounded below).
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().in(PER_PAGE_OPTIONS).optional(),
})
