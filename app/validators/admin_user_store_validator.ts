import vine from '@vinejs/vine'
import { newPasswordSchema } from '#validators/helpers/customer_password'

export const adminUserStoreValidator = vine.create({
  fullName: vine.string().trim().maxLength(255).nullable(),
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
