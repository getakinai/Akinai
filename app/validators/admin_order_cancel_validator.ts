import vine from '@vinejs/vine'
import { CANCEL_REASONS } from '#models/order'

export const adminOrderCancelValidator = vine.create({
  reason: vine.enum(CANCEL_REASONS),
  restock: vine.boolean({ strict: true }),
  refund: vine.boolean({ strict: true }),
  notifyCustomer: vine.boolean({ strict: true }),
  staffNote: vine.string().trim().maxLength(500).nullable().optional(),
})
