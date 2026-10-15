import vine from '@vinejs/vine'
import { customerLocationFields, customerProfileFields } from '#validators/helpers/customer_fields'

const { countryCode, timezone } = customerLocationFields()

/**
 * `meta.customerId` is the signed-in customer, so keeping their own email
 * (or saved country) does not fail its check. `currentPassword` is required
 * by the service only when the email (the login) changes. Omitting the
 * country or timezone keeps the saved value; neither can be cleared.
 */
export const customersAccountDetailsUpdateValidator = vine
  .withMetaData<{ customerId: string }>()
  .create({
    ...customerProfileFields(),
    countryCode: countryCode.optional(),
    timezone: timezone.optional(),
    currentPassword: vine.string().maxLength(255).optional(),
  })
