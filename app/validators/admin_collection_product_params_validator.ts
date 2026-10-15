import vine from '@vinejs/vine'

/**
 * Validates the parent `:collectionId` on nested collection product routes.
 * The product `:id` is already checked by UuidRouteParamMiddleware.
 */
export const adminCollectionProductParamsValidator = vine.create({
  params: vine.object({
    collectionId: vine.string().uuid(),
  }),
})
