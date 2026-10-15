import vine from '@vinejs/vine'
import { refundLineFields } from '#validators/helpers/refund_fields'

export const adminOrderRefundCalculateValidator = vine.create(refundLineFields())
