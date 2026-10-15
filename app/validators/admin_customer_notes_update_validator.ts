import vine from '@vinejs/vine'
import { MAX_CUSTOMER_NOTE_LENGTH, MAX_CUSTOMER_TAGS } from '#constants/customer_marketing'
import { customerTagSchema } from '#validators/helpers/customer_segment_fields'

export const adminCustomerNotesUpdateValidator = vine.create({
  tags: vine.array(customerTagSchema()).maxLength(MAX_CUSTOMER_TAGS),
  note: vine.string().trim().maxLength(MAX_CUSTOMER_NOTE_LENGTH).nullable(),
})
