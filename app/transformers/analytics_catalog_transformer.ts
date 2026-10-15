import { BaseTransformer } from '@adonisjs/core/transformers'
import type { AnalyticsCatalog } from '#services/analytics_report_service'

/** Prebuilt report list, grouped by category. */
export default class AnalyticsCatalogTransformer extends BaseTransformer<AnalyticsCatalog> {
  toObject() {
    return {
      categories: this.resource.categories.map((category) => ({
        key: category.key,
        label: category.label,
        available: category.available,
        reports: category.reports.map((report) => ({
          key: report.key,
          title: report.title,
          description: report.description,
          createdBy: report.createdBy,
        })),
      })),
    }
  }
}
