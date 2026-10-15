import vine from '@vinejs/vine'
import { helpCategoryFields } from '#validators/helpers/help_fields'

export const adminHelpCategoryStoreValidator = vine.create({
  ...helpCategoryFields(),
})
