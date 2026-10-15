import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsReportService from '#services/analytics_report_service'
import AnalyticsDashboardTransformer from '#transformers/analytics_dashboard_transformer'
import { adminAnalyticsQueryValidator } from '#validators/admin_analytics_query_validator'

@inject()
export default class AdminAnalyticsViewController {
  constructor(protected analyticsReportService: AnalyticsReportService) {}

  async handle(ctx: HttpContext) {
    const query = await ctx.request.validateUsing(adminAnalyticsQueryValidator, {
      data: ctx.request.qs(),
    })
    const dashboard = await this.analyticsReportService.dashboard(query)

    return ctx.serialize(AnalyticsDashboardTransformer.transform(dashboard))
  }
}
