import vine from '@vinejs/vine'
import { MAX_SUPPORT_CHAT_QUESTION_LENGTH } from '#constants/support'

export const storefrontSupportChatQueryValidator = vine.create({
  q: vine.string().trim().minLength(1).maxLength(MAX_SUPPORT_CHAT_QUESTION_LENGTH),
})
