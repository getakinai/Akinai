import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import VerificationCodeException from '#exceptions/verification_code_exception'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

@inject()
export default class CustomersRegistrationVerifyViewController {
  constructor(protected customerService: CustomerService) {}

  /**
   * The email the pending signup code was sent to.
   */
  async handle({ session }: HttpContext) {
    const email = await this.customerService.pendingVerificationEmail(
      session.get(VERIFICATION_SESSION_KEYS.signup),
      'signup'
    )
    if (!email) throw VerificationCodeException.missing()
    return { data: { email } }
  }
}
