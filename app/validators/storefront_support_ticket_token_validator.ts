import vine from '@vinejs/vine'
import { SUPPORT_ACCESS_TOKEN_PATTERN } from '#constants/support'

export const storefrontSupportTicketTokenValidator = vine.create({
  token: vine.string().regex(SUPPORT_ACCESS_TOKEN_PATTERN),
})
