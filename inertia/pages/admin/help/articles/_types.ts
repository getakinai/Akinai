import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

/** Mirrors `app/constants/help.ts`. */
export const HELP_ARTICLE_STATUSES = ['draft', 'active', 'archived'] as const
export const MAX_HELP_BODY_LENGTH = 50_000
export const MAX_HELP_KEYWORDS = 30
export const MAX_HELP_RELATED = 10
const HELP_INTERNAL_PATH = /^\/(?![/\\])[\w\-./?=&%]*$/

export const ADMIN_HELP_ARTICLES_SORT_KEYS = ['title', 'status', 'position', 'updatedAt'] as const

export const HelpArticleStatusSchema = z.enum(HELP_ARTICLE_STATUSES)
export type HelpArticleStatus = z.infer<typeof HelpArticleStatusSchema>

export const AdminHelpArticlesSortKeySchema = z.enum(ADMIN_HELP_ARTICLES_SORT_KEYS)
export type AdminHelpArticlesSortKey = z.infer<typeof AdminHelpArticlesSortKeySchema>

export const AdminHelpArticleStatusFilterSchema = z.enum(['', ...HELP_ARTICLE_STATUSES])
export type AdminHelpArticleStatusFilter = z.infer<typeof AdminHelpArticleStatusFilterSchema>

const CategoryRefSchema = z.object({ id: z.uuid(), slug: z.string(), title: z.string() })

export const AdminHelpArticleListItemSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  popular: z.boolean(),
  position: z.number(),
  status: HelpArticleStatusSchema,
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  categoryId: z.uuid(),
  category: CategoryRefSchema.nullable(),
})

export type AdminHelpArticleListItem = z.infer<typeof AdminHelpArticleListItemSchema>

export const AdminHelpArticleSchema = AdminHelpArticleListItemSchema.extend({
  keywords: z.array(z.string()),
  bodyMarkdown: z.string(),
  ctaLabel: z.string().nullable(),
  ctaHref: z.string().nullable(),
  groupId: z.uuid().nullable(),
  relatedIds: z.array(z.uuid()),
})

export type AdminHelpArticle = z.infer<typeof AdminHelpArticleSchema>

export const AdminHelpArticleOptionSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  status: HelpArticleStatusSchema,
})

export type AdminHelpArticleOption = z.infer<typeof AdminHelpArticleOptionSchema>

export const AdminHelpArticlesListQuerySchema = z.object({
  q: z.string(),
  status: AdminHelpArticleStatusFilterSchema,
  categoryId: z.union([z.uuid(), z.literal('')]),
  sort: AdminHelpArticlesSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminHelpArticlesListQuery = z.infer<typeof AdminHelpArticlesListQuerySchema>

export const AdminHelpArticlesListResponseSchema = paginatedResponse(AdminHelpArticleListItemSchema)

export const AdminHelpArticleResponseSchema = z.object({ data: AdminHelpArticleSchema })

export const AdminHelpArticleOptionsResponseSchema = z.object({
  data: z.array(AdminHelpArticleOptionSchema),
})

export const HelpMarkdownPreviewResponseSchema = z.object({
  data: z.object({ html: z.string() }),
})

export const AdminHelpArticleFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(160),
  slug: z.string().trim().max(100).nullable(),
  description: z.string().trim().min(1, 'Enter a short summary').max(300),
  categoryId: z.uuid('Pick a category'),
  groupId: z.uuid().nullable(),
  keywords: z.array(z.string().trim().min(1).max(60)).max(MAX_HELP_KEYWORDS),
  bodyMarkdown: z
    .string()
    .trim()
    .min(1, 'Write the article')
    .max(MAX_HELP_BODY_LENGTH, 'This article is too long'),
  popular: z.boolean(),
  position: z
    .number({ error: 'Enter a number' })
    .int('Use a whole number')
    .min(0, 'Use 0 or more')
    .max(1000, 'Use 1000 or less'),
  ctaLabel: z.string().trim().max(60).nullable(),
  ctaHref: z
    .string()
    .trim()
    .max(200)
    .regex(HELP_INTERNAL_PATH, 'Use a link inside the store, starting with /')
    .nullable(),
  status: z.enum(['draft', 'active']),
  relatedIds: z.array(z.uuid()).max(MAX_HELP_RELATED, `Pick ${MAX_HELP_RELATED} or fewer`),
})

export type AdminHelpArticleForm = z.infer<typeof AdminHelpArticleFormSchema>
