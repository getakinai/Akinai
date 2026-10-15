import type { HttpContext } from '@adonisjs/core/http'

export default class AdminPaymentsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/payments/home', {})
  }
}
