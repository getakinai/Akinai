import vine from '@vinejs/vine'
import { customerAddressFields } from '#validators/helpers/customer_fields'

export const customersAccountAddressUpdateValidator = vine.create(customerAddressFields())
