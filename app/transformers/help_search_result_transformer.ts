import type { HelpSearchResult } from '#services/help_center_service'
import { helpArticleSummary } from '#transformers/help_article_summary_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class HelpSearchResultTransformer extends BaseTransformer<HelpSearchResult> {
  toObject() {
    return {
      ...helpArticleSummary(this.resource.article),
      categoryTitle: this.resource.category.title,
    }
  }
}
