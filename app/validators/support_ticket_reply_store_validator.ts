import vine from '@vinejs/vine'
import { MAX_SUPPORT_MESSAGE_LENGTH } from '#constants/support'

/** A customer's reply, from the emailed link or `/account/support/:id`. */
export const supportTicketReplyStoreValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(MAX_SUPPORT_MESSAGE_LENGTH),
})
