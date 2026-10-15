import vine from '@vinejs/vine'

export const adminAccountMfaStoreValidator = vine.create({
  code: vine
    .string()
    .trim()
    .regex(/^\d{6}$/),
})
