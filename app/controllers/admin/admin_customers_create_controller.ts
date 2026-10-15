import type { HttpContext } from '@adonisjs/core/http'

export default class AdminCustomersCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/customers/create', {})
  }
}
