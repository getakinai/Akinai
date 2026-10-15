import vine from '@vinejs/vine'
import { MANUAL_PAYMENT_STATUSES } from '#models/order'

export const adminDraftOrderCompleteValidator = vine.create({
  paymentStatus: vine.enum(MANUAL_PAYMENT_STATUSES),
})
