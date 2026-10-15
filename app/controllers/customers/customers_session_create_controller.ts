import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersSessionCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/auth/login', {})
  }
}
