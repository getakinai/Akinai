import vine from '@vinejs/vine'
import { MAX_SUPPORT_MESSAGE_LENGTH } from '#constants/support'

export const adminSupportTicketMessageStoreValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(MAX_SUPPORT_MESSAGE_LENGTH),
  isInternal: vine.boolean({ strict: true }),
})
