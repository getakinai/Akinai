import type { HttpContext } from '@adonisjs/core/http'
import { adminAnalyticsQueryValidator } from '#validators/admin_analytics_query_validator'

export default class AdminAnalyticsHomeController {
  async handle({ inertia, request }: HttpContext) {
    const query = await request.validateUsing(adminAnalyticsQueryValidator, { data: request.qs() })
    return inertia.render('admin/analytics/home', {
      from: query.from ?? null,
      to: query.to ?? null,
      compare: query.compare ?? null,
    })
  }
}
