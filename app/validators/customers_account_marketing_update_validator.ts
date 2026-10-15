import vine from '@vinejs/vine'

export const customersAccountMarketingUpdateValidator = vine.create({
  acceptsMarketing: vine.boolean({ strict: true }),
})
