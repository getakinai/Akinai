import { z } from 'zod'

export const HELP_ICONS = [
  'rocket',
  'shopping-bag',
  'credit-card',
  'truck',
  'rotate-ccw',
  'user',
  'help-circle',
] as const

export type HelpIconName = (typeof HELP_ICONS)[number]

export const HelpArticleSummarySchema = z.object({
  slug: z.string(),
  categorySlug: z.string(),
  title: z.string(),
  description: z.string(),
})

export type HelpArticleSummary = z.infer<typeof HelpArticleSummarySchema>

export const HelpCategorySummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.enum(HELP_ICONS).catch('help-circle'),
  articleCount: z.number(),
  articles: z.array(HelpArticleSummarySchema),
})

export type HelpCategorySummary = z.infer<typeof HelpCategorySummarySchema>

export const HelpCenterHomeSchema = z.object({
  categories: z.array(HelpCategorySummarySchema),
  popular: z.array(HelpArticleSummarySchema),
})

export type HelpCenterHome = z.infer<typeof HelpCenterHomeSchema>

export const HelpCenterHomeResponseSchema = z.object({ data: HelpCenterHomeSchema })

export const HelpCategorySchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.enum(HELP_ICONS).catch('help-circle'),
  sections: z.array(
    z.object({
      group: z.object({ slug: z.string(), title: z.string() }).nullable(),
      articles: z.array(HelpArticleSummarySchema),
    })
  ),
})

export type HelpCategory = z.infer<typeof HelpCategorySchema>

export const HelpCategoryResponseSchema = z.object({ data: HelpCategorySchema })

export const HelpArticleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  cta: z
    .object({
      label: z.string(),
      href: z.string().regex(/^\/(?![/\\])/),
    })
    .nullable()
    .catch(null),
  category: z.object({ slug: z.string(), title: z.string() }),
  related: z.array(HelpArticleSummarySchema),
  previous: HelpArticleSummarySchema.nullable(),
  next: HelpArticleSummarySchema.nullable(),
})

export type HelpArticle = z.infer<typeof HelpArticleSchema>

export const HelpArticleResponseSchema = z.object({ data: HelpArticleSchema })

export const HelpSearchResultSchema = HelpArticleSummarySchema.extend({
  categoryTitle: z.string(),
})

export type HelpSearchResult = z.infer<typeof HelpSearchResultSchema>

export const HelpSearchResponseSchema = z.object({ data: z.array(HelpSearchResultSchema) })
