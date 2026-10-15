import vine from '@vinejs/vine'
import { ORDER_NOTE_VISIBILITIES } from '#constants/order_notes'

export const adminOrderNoteStoreValidator = vine.create({
  visibility: vine.enum(ORDER_NOTE_VISIBILITIES),
  body: vine.string().trim().minLength(1).maxLength(2000),
})
