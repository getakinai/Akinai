import vine from '@vinejs/vine'

/**
 * Validates the parent `:customerId` on nested address routes. The address
 * `:id` is already checked by UuidRouteParamMiddleware.
 */
export const adminCustomerAddressParamsValidator = vine.create({
  params: vine.object({
    customerId: vine.string().uuid(),
  }),
})
