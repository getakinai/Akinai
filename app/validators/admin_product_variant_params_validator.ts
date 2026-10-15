import vine from '@vinejs/vine'

/**
 * Validates the parent `:productId` on nested variant routes. The variant
 * `:id` is already checked by UuidRouteParamMiddleware.
 */
export const adminProductVariantParamsValidator = vine.create({
  params: vine.object({
    productId: vine.string().uuid(),
  }),
})
