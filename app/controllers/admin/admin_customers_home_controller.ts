import type { HttpContext } from '@adonisjs/core/http'

export default class AdminCustomersHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/customers/home', {})
  }
}
