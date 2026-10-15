import vine from '@vinejs/vine'

/** A 6-digit authenticator code or a recovery code (`xxxxx-xxxxx`). */
export const adminLoginMfaValidator = vine.create({
  code: vine.string().trim().minLength(6).maxLength(32),
})
