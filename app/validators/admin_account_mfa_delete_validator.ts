import vine from '@vinejs/vine'
import { currentPasswordSchema } from '#validators/helpers/customer_password'

export const adminAccountMfaDeleteValidator = vine.create({
  password: currentPasswordSchema(),
  code: vine.string().trim().minLength(6).maxLength(32),
})
