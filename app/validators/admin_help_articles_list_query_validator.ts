import vine from '@vinejs/vine'
import { HELP_ARTICLE_STATUSES } from '#constants/help'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_HELP_ARTICLES_SORT_KEYS = ['title', 'status', 'position', 'updatedAt'] as const

export const adminHelpArticlesListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_HELP_ARTICLES_SORT_KEYS),
  status: vine.enum(HELP_ARTICLE_STATUSES).optional(),
  categoryId: vine.string().uuid().optional(),
})
