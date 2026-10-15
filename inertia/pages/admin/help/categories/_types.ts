import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

/** Mirrors `HELP_ICONS` in `app/constants/help.ts`. */
export const HELP_ICONS = [
  'rocket',
  'shopping-bag',
  'credit-card',
  'truck',
  'rotate-ccw',
  'user',
  'help-circle',
] as const

export const MAX_HELP_GROUPS = 20

export const ADMIN_HELP_CATEGORIES_SORT_KEYS = [
  'title',
  'position',
  'articlesCount',
  'updatedAt',
] as const

export const HelpIconSchema = z.enum(HELP_ICONS)
export type HelpIconName = z.infer<typeof HelpIconSchema>

export const AdminHelpCategoriesSortKeySchema = z.enum(ADMIN_HELP_CATEGORIES_SORT_KEYS)
export type AdminHelpCategoriesSortKey = z.infer<typeof AdminHelpCategoriesSortKeySchema>

export const AdminHelpCategoryStatusFilterSchema = z.enum(['', 'active', 'archived'])
export type AdminHelpCategoryStatusFilter = z.infer<typeof AdminHelpCategoryStatusFilterSchema>

export const AdminHelpCategoryGroupSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  position: z.number(),
})

export type AdminHelpCategoryGroup = z.infer<typeof AdminHelpCategoryGroupSchema>

export const AdminHelpCategorySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  icon: HelpIconSchema.catch('help-circle'),
  popular: z.boolean(),
  position: z.number(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  articlesCount: z.number(),
  groups: z.array(AdminHelpCategoryGroupSchema),
})

export type AdminHelpCategory = z.infer<typeof AdminHelpCategorySchema>

export const AdminHelpCategoryOptionSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  groups: z.array(AdminHelpCategoryGroupSchema),
})

export type AdminHelpCategoryOption = z.infer<typeof AdminHelpCategoryOptionSchema>

export const AdminHelpCategoriesListQuerySchema = z.object({
  q: z.string(),
  status: AdminHelpCategoryStatusFilterSchema,
  sort: AdminHelpCategoriesSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminHelpCategoriesListQuery = z.infer<typeof AdminHelpCategoriesListQuerySchema>

export const AdminHelpCategoriesListResponseSchema = paginatedResponse(AdminHelpCategorySchema)

export const AdminHelpCategoryResponseSchema = z.object({ data: AdminHelpCategorySchema })

export const AdminHelpCategoryOptionsResponseSchema = z.object({
  data: z.array(AdminHelpCategoryOptionSchema),
})

const position = z
  .number({ error: 'Enter a number' })
  .int('Use a whole number')
  .min(0, 'Use 0 or more')
  .max(1000, 'Use 1000 or less')

export const AdminHelpCategoryFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(120),
  slug: z.string().trim().max(100).nullable(),
  description: z.string().trim().min(1, 'Enter a short description').max(300),
  icon: HelpIconSchema,
  popular: z.boolean(),
  position,
  groups: z
    .array(
      z.object({
        id: z.uuid().nullable(),
        title: z.string().trim().min(1, 'Enter a section title').max(120),
        position,
      })
    )
    .max(MAX_HELP_GROUPS, `Use ${MAX_HELP_GROUPS} sections or fewer`),
})

export type AdminHelpCategoryForm = z.infer<typeof AdminHelpCategoryFormSchema>
