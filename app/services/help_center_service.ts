import { inject } from '@adonisjs/core'
import { errors as lucidErrors } from '@adonisjs/lucid'
import type { HelpSeedCategory } from '#constants/help'
import HelpArticleRepository, {
  type HelpArticle,
  type HelpCategory,
  type HelpGroup,
  type HelpImportResult,
} from '#repositories/help_article_repository'
import { renderHelpMarkdown } from '#utils/help_markdown'

const MAX_POPULAR = 8
const MAX_SEARCH_RESULTS = 20

export type HelpCenterHome = {
  categories: HelpCategory[]
  popular: HelpArticle[]
}

export type HelpCategoryDetail = {
  category: HelpCategory
  sections: { group: HelpGroup | null; articles: HelpArticle[] }[]
}

export type HelpArticleDetail = {
  article: HelpArticle
  category: HelpCategory
  related: HelpArticle[]
  previous: HelpArticle | null
  next: HelpArticle | null
}

export type HelpSearchResult = {
  article: HelpArticle
  category: HelpCategory
}

@inject()
export default class HelpCenterService {
  constructor(protected helpArticleRepository: HelpArticleRepository) {}

  /**
   * Copies the starter guides into the database. Only categories and
   * articles whose slugs are new are inserted; staff edits are never
   * overwritten.
   */
  async importStarterContent(content: HelpSeedCategory[]): Promise<HelpImportResult> {
    return this.helpArticleRepository.insertMissing(
      content.map((category) => ({
        slug: category.slug,
        title: category.title,
        description: category.description,
        icon: category.icon,
        popular: category.popular,
        position: category.order,
        groups: category.groups.map((group) => ({
          slug: group.slug,
          title: group.title,
          position: group.order,
        })),
        articles: category.articles.map((article) => {
          const rendered = renderHelpMarkdown(article.markdown)
          return {
            slug: article.slug,
            title: article.title,
            description: article.description,
            keywords: article.keywords,
            bodyMarkdown: article.markdown,
            bodyHtml: rendered.html,
            bodyText: rendered.text,
            bodyParagraphs: rendered.paragraphs,
            popular: article.popular,
            position: article.order,
            ctaLabel: article.cta?.label ?? null,
            ctaHref: article.cta?.href ?? null,
            status: 'active' as const,
            groupSlug: article.group,
            relatedSlugs: article.related,
          }
        }),
      }))
    )
  }

  async home(): Promise<HelpCenterHome> {
    const { categories, articles } = await this.helpArticleRepository.library()
    return {
      categories,
      popular: articles.filter((article) => article.popular).slice(0, MAX_POPULAR),
    }
  }

  async findCategoryOrFail(slug: string): Promise<HelpCategoryDetail> {
    const { categories } = await this.helpArticleRepository.library()
    const category = categories.find((item) => item.slug === slug)
    if (!category) throw new lucidErrors.E_ROW_NOT_FOUND()

    const sections: HelpCategoryDetail['sections'] = category.groups
      .map((group) => ({
        group,
        articles: category.articles.filter((article) => article.group === group.slug),
      }))
      .filter((section) => section.articles.length > 0)

    const ungrouped = category.articles.filter((article) => !article.group)
    if (ungrouped.length > 0) sections.push({ group: null, articles: ungrouped })

    return { category, sections }
  }

  async findArticleOrFail(categorySlug: string, slug: string): Promise<HelpArticleDetail> {
    const { categories, articles } = await this.helpArticleRepository.library()
    const category = categories.find((item) => item.slug === categorySlug)
    const index = category?.articles.findIndex((article) => article.slug === slug) ?? -1
    if (!category || index === -1) throw new lucidErrors.E_ROW_NOT_FOUND()

    const article = category.articles[index]
    const bySlug = new Map(articles.map((item) => [item.slug, item]))

    return {
      article,
      category,
      related: article.related.flatMap((relatedSlug) => bySlug.get(relatedSlug) ?? []),
      previous: category.articles[index - 1] ?? null,
      next: category.articles[index + 1] ?? null,
    }
  }

  /**
   * Ranks articles by where the words appear: title and keywords count most,
   * then the description, then the body. Every word must match somewhere.
   */
  async search(query: string): Promise<HelpSearchResult[]> {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10)
    if (words.length === 0) return []

    const { categories } = await this.helpArticleRepository.library()
    const scored: (HelpSearchResult & { score: number })[] = []

    for (const category of categories) {
      for (const article of category.articles) {
        const score = this.score(article, words)
        if (score > 0) scored.push({ article, category, score })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
      .slice(0, MAX_SEARCH_RESULTS)
      .map(({ article, category }) => ({ article, category }))
  }

  protected score(article: HelpArticle, words: string[]): number {
    const title = article.title.toLowerCase()
    const keywords = article.keywords.join(' ').toLowerCase()
    const description = article.description.toLowerCase()
    const body = article.text.toLowerCase()

    let total = 0
    for (const word of words) {
      let score = 0
      if (title.includes(word)) score += 10
      if (keywords.includes(word)) score += 8
      if (description.includes(word)) score += 4
      if (body.includes(word)) score += 1
      if (score === 0) return 0
      total += score
    }
    return total
  }
}
