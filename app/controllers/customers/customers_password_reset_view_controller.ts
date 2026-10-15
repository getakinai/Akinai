import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import VerificationCodeException from '#exceptions/verification_code_exception'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

@inject()
export default class CustomersPasswordResetViewController {
  constructor(protected customerService: CustomerService) {}

  /**
   * The email the reset code was sent to (as typed on the forgot form).
   */
  async handle({ session }: HttpContext) {
    const email = await this.customerService.pendingVerificationEmail(
      session.get(VERIFICATION_SESSION_KEYS.password_reset),
      'password_reset'
    )
    if (!email) throw VerificationCodeException.missing()
    return { data: { email } }
  }
}
