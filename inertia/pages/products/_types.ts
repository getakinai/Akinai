import { z } from 'zod'
import { cursorPaginatedResponse } from '~/lib/schemas'

export const REVIEW_TITLE_MAX = 120
export const REVIEW_BODY_MIN = 10
export const REVIEW_BODY_MAX = 2000

export const ProductReviewSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable(),
  body: z.string(),
  author: z.string(),
  createdAt: z.string(),
})

export type ProductReview = z.infer<typeof ProductReviewSchema>

export const ProductReviewResponseSchema = z.object({ data: ProductReviewSchema })

export const ProductReviewsResponseSchema = cursorPaginatedResponse(ProductReviewSchema)

export const ProductReviewSummarySchema = z.object({
  average: z.number().nullable(),
  count: z.number().int(),
  distribution: z.array(z.object({ rating: z.number().int(), count: z.number().int() })),
  viewerHasReviewed: z.boolean(),
})

export type ProductReviewSummary = z.infer<typeof ProductReviewSummarySchema>

export const ProductReviewSummaryResponseSchema = z.object({ data: ProductReviewSummarySchema })

export const ProductReviewFormSchema = z.object({
  rating: z.number().int().min(1, 'Choose a star rating').max(5),
  title: z.string().trim().max(REVIEW_TITLE_MAX, 'Keep the title under 120 characters').nullable(),
  body: z
    .string()
    .trim()
    .min(REVIEW_BODY_MIN, `Write at least ${REVIEW_BODY_MIN} characters`)
    .max(REVIEW_BODY_MAX, `Keep your review under ${REVIEW_BODY_MAX} characters`),
})

export type ProductReviewForm = z.infer<typeof ProductReviewFormSchema>
