import vine from '@vinejs/vine'
import { CUSTOMER_LOCATION_RETURN_TO } from '#validators/customers_account_location_update_validator'

export const customersAccountWelcomeQueryValidator = vine.create({
  return_to: vine.enum(CUSTOMER_LOCATION_RETURN_TO).optional(),
})
