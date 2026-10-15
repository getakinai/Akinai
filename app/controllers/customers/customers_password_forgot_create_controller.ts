import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersPasswordForgotCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/auth/forgot_password', {})
  }
}
