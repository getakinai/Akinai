import type { HttpContext } from '@adonisjs/core/http'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

export default class CustomersPasswordResetCreateController {
  async handle({ inertia, response, session }: HttpContext) {
    if (!session.get(VERIFICATION_SESSION_KEYS.password_reset)) {
      return response.redirect().toRoute('customers.password.forgot.create')
    }
    return inertia.render('customers/auth/reset_password', {})
  }
}
