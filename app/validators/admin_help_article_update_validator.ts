import vine from '@vinejs/vine'
import { helpArticleFields } from '#validators/helpers/help_fields'

export const adminHelpArticleUpdateValidator = vine.create({
  ...helpArticleFields(),
})
