import vine from '@vinejs/vine'
import {
  customerProfileFields,
  optionalCustomerLocationFields,
} from '#validators/helpers/customer_fields'

export const adminCustomerUpdateValidator = vine
  .withMetaData<{ customerId: string }>()
  .create({ ...customerProfileFields(), ...optionalCustomerLocationFields() })
