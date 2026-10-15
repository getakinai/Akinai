import type { HelpArticle } from '#repositories/help_article_repository'
import { BaseTransformer } from '@adonisjs/core/transformers'

export function helpArticleSummary(article: HelpArticle) {
  return {
    slug: article.slug,
    categorySlug: article.categorySlug,
    title: article.title,
    description: article.description,
  }
}

export default class HelpArticleSummaryTransformer extends BaseTransformer<HelpArticle> {
  toObject() {
    return helpArticleSummary(this.resource)
  }
}
