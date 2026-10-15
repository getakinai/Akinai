import vine from '@vinejs/vine'
import { currentPasswordSchema } from '#validators/helpers/customer_password'

export const customerLoginValidator = vine.create({
  email: vine.string().trim().toLowerCase().email().maxLength(254),
  password: currentPasswordSchema(),
})
