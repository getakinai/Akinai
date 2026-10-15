import type { HelpCategory } from '#repositories/help_article_repository'
import type { HelpCategoryDetail } from '#services/help_center_service'
import { helpArticleSummary } from '#transformers/help_article_summary_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export function helpCategorySummary(category: HelpCategory) {
  return {
    slug: category.slug,
    title: category.title,
    description: category.description,
    icon: category.icon,
    articleCount: category.articles.length,
    articles: category.articles.slice(0, 4).map(helpArticleSummary),
  }
}

export default class HelpCategoryTransformer extends BaseTransformer<HelpCategoryDetail> {
  toObject() {
    const { category, sections } = this.resource
    return {
      slug: category.slug,
      title: category.title,
      description: category.description,
      icon: category.icon,
      sections: sections.map(({ group, articles }) => ({
        group: group ? { slug: group.slug, title: group.title } : null,
        articles: articles.map(helpArticleSummary),
      })),
    }
  }
}
