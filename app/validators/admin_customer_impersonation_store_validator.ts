import vine from '@vinejs/vine'

export const adminCustomerImpersonationStoreValidator = vine.create({
  reason: vine.string().trim().minLength(5).maxLength(500),
})
