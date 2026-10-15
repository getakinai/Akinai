import vine from '@vinejs/vine'

export const adminReturnApproveValidator = vine.create({
  staffNote: vine.string().trim().maxLength(1000).nullable().optional(),
  notifyCustomer: vine.boolean({ strict: true }),
})
