import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsReportService from '#services/analytics_report_service'
import AnalyticsLiveTransformer from '#transformers/analytics_live_transformer'

@inject()
export default class AdminAnalyticsLiveViewController {
  constructor(protected analyticsReportService: AnalyticsReportService) {}

  async handle(ctx: HttpContext) {
    const live = await this.analyticsReportService.live()
    return ctx.serialize(AnalyticsLiveTransformer.transform(live))
  }
}
