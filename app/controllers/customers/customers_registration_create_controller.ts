import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersRegistrationCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/auth/signup', {})
  }
}
