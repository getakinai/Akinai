import vine from '@vinejs/vine'

export const recaptchaTokenValidator = vine.create({
  token: vine.string().trim().minLength(1).maxLength(4096),
})
