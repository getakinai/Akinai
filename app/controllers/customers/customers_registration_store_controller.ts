import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import { customerRegisterValidator } from '#validators/customer_register_validator'
import { VERIFICATION_SESSION_KEYS } from '#constants/customer_verification'

@inject()
export default class CustomersRegistrationStoreController {
  constructor(protected customerService: CustomerService) {}

  /**
   * Starts a signup. No account exists until the emailed code is entered at
   * `/signup/verify`. The response is the same whether or not the email
   * already has an account.
   */
  async handle({ request, response, session }: HttpContext) {
    const { fullName, email, phone, password, acceptsMarketing } =
      await request.validateUsing(customerRegisterValidator)
    const verification = await this.customerService.startSignup({
      fullName,
      email,
      phone,
      password,
      acceptsMarketing: acceptsMarketing ?? false,
    })

    session.put(VERIFICATION_SESSION_KEYS.signup, verification.id)
    return response.accepted({ data: { redirectTo: '/signup/verify' } })
  }
}
