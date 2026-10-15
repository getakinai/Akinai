import vine from '@vinejs/vine'

export const adminCustomerMarketingUpdateValidator = vine.create({
  acceptsMarketing: vine.boolean({ strict: true }),
})
