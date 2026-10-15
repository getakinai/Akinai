import vine from '@vinejs/vine'
import { MAX_HELP_BODY_LENGTH } from '#constants/help'

export const adminHelpArticlePreviewValidator = vine.create({
  markdown: vine.string().maxLength(MAX_HELP_BODY_LENGTH),
})
