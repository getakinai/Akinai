import vine from '@vinejs/vine'
import { helpCategoryFields } from '#validators/helpers/help_fields'

export const adminHelpCategoryUpdateValidator = vine.create({
  ...helpCategoryFields(),
})
