import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import AnalyticsReportService from '#services/analytics_report_service'
import AnalyticsReportTransformer from '#transformers/analytics_report_transformer'
import { adminAnalyticsQueryValidator } from '#validators/admin_analytics_query_validator'
import { adminAnalyticsReportShowValidator } from '#validators/admin_analytics_report_show_validator'

@inject()
export default class AdminAnalyticsReportsViewController {
  constructor(protected analyticsReportService: AnalyticsReportService) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await adminAnalyticsReportShowValidator.tryValidate({
      key: ctx.params.key,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const query = await ctx.request.validateUsing(adminAnalyticsQueryValidator, {
      data: ctx.request.qs(),
    })
    const report = await this.analyticsReportService.report(params.key, query)

    return ctx.serialize(AnalyticsReportTransformer.transform(report))
  }
}
