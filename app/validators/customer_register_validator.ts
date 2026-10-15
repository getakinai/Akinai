import vine from '@vinejs/vine'
import { newCustomerPasswordSchema } from '#validators/helpers/customer_password'
import { notDisposableEmail } from '#validators/rules/not_disposable_email'

/**
 * No uniqueness check on `email`: whether it already has an account is
 * handled after validation, without telling the browser.
 */
export const customerRegisterValidator = vine.create({
  fullName: vine.string().trim().maxLength(255).nullable(),
  email: vine.string().trim().toLowerCase().email().maxLength(254).use(notDisposableEmail()),
  phone: vine.string().trim().maxLength(32).nullable(),
  password: newCustomerPasswordSchema(),
  passwordConfirmation: vine.string().sameAs('password'),
  acceptsMarketing: vine.boolean({ strict: true }).optional(),
})
