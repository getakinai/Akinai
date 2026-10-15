import vine from '@vinejs/vine'
import { countryCodeSchema } from '#validators/helpers/country_codes'
import { newPasswordSchema } from '#validators/helpers/customer_password'

export const adminSetupStoreValidator = vine.create({
  setupToken: vine.string().trim().minLength(1).maxLength(256),
  operatingCountryCode: countryCodeSchema(),
  fullName: vine.string().trim().minLength(1).maxLength(255),
  email: vine
    .string()
    .trim()
    .toLowerCase()
    .email()
    .maxLength(254)
    .unique({ table: 'users', column: 'email' }),
  password: newPasswordSchema(),
  passwordConfirmation: vine.string().sameAs('password'),
})
