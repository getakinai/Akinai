import vine from '@vinejs/vine'

export const customerForgotPasswordValidator = vine.create({
  email: vine.string().trim().toLowerCase().email().maxLength(254),
})
