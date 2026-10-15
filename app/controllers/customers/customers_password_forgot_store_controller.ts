import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import { customerForgotPasswordValidator } from '#validators/customer_forgot_password_validator'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

@inject()
export default class CustomersPasswordForgotStoreController {
  constructor(protected customerService: CustomerService) {}

  /**
   * Same response for every email, so it can't be used to find accounts.
   */
  async handle({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(customerForgotPasswordValidator)
    const verification = await this.customerService.startPasswordReset(email)

    session.put(VERIFICATION_SESSION_KEYS.password_reset, verification.id)
    return response.accepted({ data: { redirectTo: '/reset-password' } })
  }
}
