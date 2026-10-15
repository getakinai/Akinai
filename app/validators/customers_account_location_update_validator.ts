import vine from '@vinejs/vine'
import { customerLocationFields } from '#validators/helpers/customer_fields'

export const CUSTOMER_LOCATION_RETURN_TO = ['account', 'checkout'] as const

export type CustomerLocationReturnTo = (typeof CUSTOMER_LOCATION_RETURN_TO)[number]

/**
 * `returnTo` is an enum, not a path, so it can't become an open redirect.
 */
export const customersAccountLocationUpdateValidator = vine.create({
  ...customerLocationFields(),
  returnTo: vine.enum(CUSTOMER_LOCATION_RETURN_TO).optional(),
})
