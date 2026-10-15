import type { HttpContext } from '@adonisjs/core/http'

export default class AdminSupportTicketsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/support/tickets/home', {})
  }
}
