import type { HelpArticleDetail } from '#services/help_center_service'
import { helpArticleSummary } from '#transformers/help_article_summary_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class HelpArticleTransformer extends BaseTransformer<HelpArticleDetail> {
  toObject() {
    const { article, category, related, previous, next } = this.resource
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.html,
      cta: article.cta,
      category: { slug: category.slug, title: category.title },
      related: related.map(helpArticleSummary),
      previous: previous ? helpArticleSummary(previous) : null,
      next: next ? helpArticleSummary(next) : null,
    }
  }
}
