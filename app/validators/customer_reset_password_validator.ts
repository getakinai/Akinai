import vine from '@vinejs/vine'
import { newCustomerPasswordSchema } from '#validators/helpers/customer_password'
import { VERIFICATION_CODE_LENGTH } from '#constants/customer_verification'

export const customerResetPasswordValidator = vine.create({
  code: vine.string().trim().fixedLength(VERIFICATION_CODE_LENGTH).regex(/^\d+$/),
  password: newCustomerPasswordSchema(),
  passwordConfirmation: vine.string().sameAs('password'),
})
