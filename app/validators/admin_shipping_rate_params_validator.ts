import vine from '@vinejs/vine'

/**
 * Validates the parent `:zoneId` on nested rate routes. The rate `:id` is
 * already checked by UuidRouteParamMiddleware.
 */
export const adminShippingRateParamsValidator = vine.create({
  params: vine.object({
    zoneId: vine.string().uuid(),
  }),
})
