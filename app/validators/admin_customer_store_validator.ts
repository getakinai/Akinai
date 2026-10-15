import vine from '@vinejs/vine'
import {
  customerProfileFields,
  optionalCustomerLocationFields,
} from '#validators/helpers/customer_fields'

export const adminCustomerStoreValidator = vine.create({
  ...customerProfileFields(),
  ...optionalCustomerLocationFields(),
})
