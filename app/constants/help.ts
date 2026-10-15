export const HELP_ICONS = [
  'rocket',
  'shopping-bag',
  'credit-card',
  'truck',
  'rotate-ccw',
  'user',
  'help-circle',
] as const

export type HelpIcon = (typeof HELP_ICONS)[number]

export const HELP_ARTICLE_STATUSES = ['draft', 'active', 'archived'] as const

export type HelpArticleStatus = (typeof HELP_ARTICLE_STATUSES)[number]

export const HELP_SLUG = /^[a-z0-9-]+$/

/** Help CTAs only link inside the store. */
export const HELP_INTERNAL_PATH = /^\/(?![/\\])[\w\-./?=&%]*$/

export const MAX_HELP_BODY_LENGTH = 50_000
export const MAX_HELP_KEYWORDS = 30
export const MAX_HELP_RELATED = 10
export const MAX_HELP_GROUPS = 20

export type HelpSeedGroup = { slug: string; title: string; order: number }

export type HelpSeedArticle = {
  slug: string
  title: string
  description: string
  keywords: string[]
  /** Slug of a group in the same category. */
  group: string | null
  order: number
  popular: boolean
  /** Article slugs, from any category. */
  related: string[]
  cta: { label: string; href: string } | null
  markdown: string
}

export type HelpSeedCategory = {
  slug: string
  title: string
  description: string
  icon: HelpIcon
  popular: boolean
  order: number
  groups: HelpSeedGroup[]
  articles: HelpSeedArticle[]
}
