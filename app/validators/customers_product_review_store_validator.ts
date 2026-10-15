import vine from '@vinejs/vine'
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from '#models/product_review'

export const REVIEW_TITLE_MAX = 120
export const REVIEW_BODY_MIN = 10
export const REVIEW_BODY_MAX = 2000

export const customersProductReviewStoreValidator = vine.create({
  rating: vine
    .number({ strict: true })
    .withoutDecimals()
    .min(REVIEW_RATING_MIN)
    .max(REVIEW_RATING_MAX),
  title: vine.string().trim().maxLength(REVIEW_TITLE_MAX).nullable(),
  body: vine.string().trim().minLength(REVIEW_BODY_MIN).maxLength(REVIEW_BODY_MAX),
})
