import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { adminAnalyticsQueryValidator } from '#validators/admin_analytics_query_validator'
import { adminAnalyticsReportShowValidator } from '#validators/admin_analytics_report_show_validator'

export default class AdminAnalyticsReportsShowController {
  async handle({ inertia, params, request }: HttpContext) {
    const [error, payload] = await adminAnalyticsReportShowValidator.tryValidate({
      key: params.key,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const query = await request.validateUsing(adminAnalyticsQueryValidator, { data: request.qs() })
    return inertia.render('admin/analytics/reports/show', {
      reportKey: payload.key,
      from: query.from ?? null,
      to: query.to ?? null,
      compare: query.compare ?? null,
    })
  }
}
