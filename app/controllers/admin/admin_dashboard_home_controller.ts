import type { HttpContext } from '@adonisjs/core/http'

export default class AdminDashboardHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/dashboard', {})
  }
}
