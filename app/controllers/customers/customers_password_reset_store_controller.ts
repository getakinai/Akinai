import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import { customerResetPasswordValidator } from '#validators/customer_reset_password_validator'
import { loginCustomer } from '#utils/customer_session'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

@inject()
export default class CustomersPasswordResetStoreController {
  constructor(protected customerService: CustomerService) {}

  async handle({ request, response, auth, session }: HttpContext) {
    const { code, password } = await request.validateUsing(customerResetPasswordValidator)
    const account = await this.customerService.completePasswordReset(
      session.get(VERIFICATION_SESSION_KEYS.password_reset),
      code,
      password,
      request.ip()
    )

    session.forget(VERIFICATION_SESSION_KEYS.password_reset)
    await this.customerService.recordLogin(account, request.ip())
    await loginCustomer({ auth, session }, account)
    return response.ok({ data: { redirectTo: '/account' } })
  }
}
