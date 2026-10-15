import type { HttpContext } from '@adonisjs/core/http'

export default class AdminSupportTicketsShowController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/support/tickets/show', { id: params.id })
  }
}
