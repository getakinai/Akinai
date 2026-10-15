import type { HttpContext } from '@adonisjs/core/http'

export default class AdminAnalyticsReportsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/analytics/reports/home', {})
  }
}
