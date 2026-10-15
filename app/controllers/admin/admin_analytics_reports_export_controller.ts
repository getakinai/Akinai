import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import AnalyticsReportExportService from '#services/analytics_report_export_service'
import { csvExportActor } from '#utils/csv'
import { adminAnalyticsReportExportQueryValidator } from '#validators/admin_analytics_report_export_query_validator'
import { adminAnalyticsReportShowValidator } from '#validators/admin_analytics_report_show_validator'

@inject()
export default class AdminAnalyticsReportsExportController {
  constructor(protected analyticsReportExportService: AnalyticsReportExportService) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await adminAnalyticsReportShowValidator.tryValidate({
      key: ctx.params.key,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const { format, ...query } = await ctx.request.validateUsing(
      adminAnalyticsReportExportQueryValidator,
      { data: ctx.request.qs() }
    )
    const file = await this.analyticsReportExportService.export(
      params.key,
      query,
      format,
      csvExportActor(ctx)
    )

    ctx.response.header('Content-Type', file.contentType)
    ctx.response.header('Content-Disposition', `attachment; filename="${file.filename}"`)
    ctx.response.header('Cache-Control', 'private, no-store')
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    return ctx.response.send(file.body)
  }
}
