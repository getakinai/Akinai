import vine from '@vinejs/vine'
import { MAX_REFUND_AMOUNT, refundLineFields } from '#validators/helpers/refund_fields'

export const adminOrderRefundStoreValidator = vine.create({
  ...refundLineFields(),
  amount: vine.number({ strict: true }).min(0.01).max(MAX_REFUND_AMOUNT).decimal([0, 2]),
  restock: vine.boolean({ strict: true }),
  locationId: vine.string().uuid().nullable().optional(),
  note: vine.string().trim().maxLength(500).nullable().optional(),
  notifyCustomer: vine.boolean({ strict: true }),
  returnId: vine.string().uuid().nullable().optional(),
})
