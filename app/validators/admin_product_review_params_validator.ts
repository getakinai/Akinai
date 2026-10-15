import vine from '@vinejs/vine'

/**
 * Validates the parent `:productId` on nested review routes. The review
 * `:id` is already checked by UuidRouteParamMiddleware.
 */
export const adminProductReviewParamsValidator = vine.create({
  params: vine.object({
    productId: vine.string().uuid(),
  }),
})
