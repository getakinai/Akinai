import vine from '@vinejs/vine'
import { currentPasswordSchema, newPasswordSchema } from '#validators/helpers/customer_password'

export const adminAccountPasswordUpdateValidator = vine.create({
  currentPassword: currentPasswordSchema(),
  password: newPasswordSchema(),
  passwordConfirmation: vine.string().sameAs('password'),
})
