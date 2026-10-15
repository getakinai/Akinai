import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import { customerVerificationCodeValidator } from '#validators/customer_verification_code_validator'
import { loginCustomer } from '#utils/customer_session'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

@inject()
export default class CustomersRegistrationVerifyStoreController {
  constructor(protected customerService: CustomerService) {}

  async handle({ request, response, auth, session }: HttpContext) {
    const { code } = await request.validateUsing(customerVerificationCodeValidator)
    const account = await this.customerService.completeSignup(
      session.get(VERIFICATION_SESSION_KEYS.signup),
      code
    )

    session.forget(VERIFICATION_SESSION_KEYS.signup)
    await this.customerService.recordLogin(account, request.ip())
    await loginCustomer({ auth, session }, account)
    return response.created({ data: { redirectTo: '/account' } })
  }
}
