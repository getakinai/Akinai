import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import {
  VERIFICATION_RESEND_COOLDOWN_SECONDS,
  VERIFICATION_SESSION_KEYS,
} from '#constants/customer_verification'

@inject()
export default class CustomersPasswordResetResendStoreController {
  constructor(protected customerService: CustomerService) {}

  /**
   * No request body: the pending reset comes from the session.
   */
  async handle({ response, session }: HttpContext) {
    await this.customerService.resendPasswordResetCode(
      session.get(VERIFICATION_SESSION_KEYS.password_reset)
    )
    return response.accepted({ data: { cooldownSeconds: VERIFICATION_RESEND_COOLDOWN_SECONDS } })
  }
}
