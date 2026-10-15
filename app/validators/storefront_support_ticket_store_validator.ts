import vine from '@vinejs/vine'
import {
  MAX_SUPPORT_MESSAGE_LENGTH,
  MAX_SUPPORT_TRANSCRIPT_ENTRIES,
  MAX_SUPPORT_TRANSCRIPT_ENTRY_LENGTH,
  SUPPORT_MOBILE_PATTERN,
} from '#constants/support'
import { notDisposableEmail } from '#validators/rules/not_disposable_email'

/**
 * A request sent from the help chat. There is no customer id field: a
 * signed-in customer is taken from the session. Contact fields are
 * optional because a signed-in customer's profile fills them in; guests
 * must send all three (checked in `SupportTicketService.open`).
 */
export const storefrontSupportTicketStoreValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(120).optional(),
  email: vine
    .string()
    .trim()
    .toLowerCase()
    .email()
    .maxLength(254)
    .use(notDisposableEmail())
    .optional(),
  mobile: vine.string().trim().regex(SUPPORT_MOBILE_PATTERN).optional(),
  concern: vine.string().trim().minLength(10).maxLength(MAX_SUPPORT_MESSAGE_LENGTH),
  transcript: vine
    .array(vine.string().trim().maxLength(MAX_SUPPORT_TRANSCRIPT_ENTRY_LENGTH))
    .maxLength(MAX_SUPPORT_TRANSCRIPT_ENTRIES)
    .optional(),
})
