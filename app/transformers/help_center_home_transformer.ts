import type { HelpCenterHome } from '#services/help_center_service'
import { helpArticleSummary } from '#transformers/help_article_summary_transformer'
import { helpCategorySummary } from '#transformers/help_category_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class HelpCenterHomeTransformer extends BaseTransformer<HelpCenterHome> {
  toObject() {
    return {
      categories: this.resource.categories.map(helpCategorySummary),
      popular: this.resource.popular.map(helpArticleSummary),
    }
  }
}
