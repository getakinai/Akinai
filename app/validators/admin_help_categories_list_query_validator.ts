import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_HELP_CATEGORIES_SORT_KEYS = [
  'title',
  'position',
  'articlesCount',
  'updatedAt',
] as const

export const adminHelpCategoriesListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_HELP_CATEGORIES_SORT_KEYS),
  status: vine.enum(['active', 'archived'] as const).optional(),
})
