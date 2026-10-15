import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsReportService from '#services/analytics_report_service'
import AnalyticsCatalogTransformer from '#transformers/analytics_catalog_transformer'

@inject()
export default class AdminAnalyticsReportsListController {
  constructor(protected analyticsReportService: AnalyticsReportService) {}

  async handle(ctx: HttpContext) {
    return ctx.serialize(
      AnalyticsCatalogTransformer.transform(this.analyticsReportService.catalog())
    )
  }
}
