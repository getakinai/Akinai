import vine from '@vinejs/vine'

export const adminReturnDeclineValidator = vine.create({
  reason: vine.string().trim().minLength(1).maxLength(500),
  notifyCustomer: vine.boolean({ strict: true }),
})
