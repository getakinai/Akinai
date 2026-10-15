import { DateTime } from 'luxon'
import type { HelpArticleStatus } from '#constants/help'
import HelpArticle from '#models/help_article'
import HelpArticleRelated from '#models/help_article_related'
import HelpCategory from '#models/help_category'
import HelpCategoryGroup from '#models/help_category_group'
import { renderHelpMarkdown } from '#utils/help_markdown'

let sequence = 0

const unique = (prefix: string) => `${prefix}-${++sequence}-${Date.now()}`

export async function createHelpCategory(
  overrides: Partial<{ title: string; archived: boolean; groups: string[]; position: number }> = {}
) {
  const slug = unique('topic')
  const category = await HelpCategory.create({
    slug,
    title: overrides.title ?? `Topic ${slug}`,
    description: 'Help with things',
    icon: 'help-circle',
    popular: false,
    position: overrides.position ?? 0,
    archivedAt: overrides.archived ? DateTime.now() : null,
  })
  const groups = await HelpCategoryGroup.createMany(
    (overrides.groups ?? []).map((title, index) => ({
      helpCategoryId: category.id,
      slug: unique('section'),
      title,
      position: index + 1,
    }))
  )
  return { category, groups }
}

export async function createHelpArticle(
  category: HelpCategory,
  overrides: Partial<{
    title: string
    markdown: string
    status: HelpArticleStatus
    groupId: string | null
    position: number
    popular: boolean
    keywords: string[]
  }> = {}
) {
  const slug = unique('article')
  const markdown = overrides.markdown ?? 'A short answer.\n\n- First step\n- Next step'
  const rendered = renderHelpMarkdown(markdown)
  return HelpArticle.create({
    helpCategoryId: category.id,
    helpCategoryGroupId: overrides.groupId ?? null,
    slug,
    title: overrides.title ?? `Article ${slug}`,
    description: 'What this article covers',
    keywords: overrides.keywords ?? [],
    bodyMarkdown: markdown,
    bodyHtml: rendered.html,
    bodyText: rendered.text,
    bodyParagraphs: rendered.paragraphs,
    popular: overrides.popular ?? false,
    position: overrides.position ?? 0,
    ctaLabel: null,
    ctaHref: null,
    status: overrides.status ?? 'active',
    archivedAt: null,
  })
}

export async function relateHelpArticles(article: HelpArticle, related: HelpArticle[]) {
  await HelpArticleRelated.createMany(
    related.map((item, position) => ({
      helpArticleId: article.id,
      relatedArticleId: item.id,
      position,
    }))
  )
}

/** A valid store/update body for `/admin/help/articles`. */
export function helpArticlePayload(categoryId: string, overrides: Record<string, unknown> = {}) {
  return {
    title: 'Track your parcel',
    slug: null,
    description: 'Follow your delivery',
    categoryId,
    groupId: null,
    keywords: ['tracking'],
    bodyMarkdown: '## Where is my order\n\nOpen **Orders** in your account.',
    popular: false,
    position: 1,
    ctaLabel: null,
    ctaHref: null,
    status: 'active',
    relatedIds: [],
    ...overrides,
  }
}
