import { inject } from '@adonisjs/core'
import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import LoginThrottleService from '#services/login_throttle_service'
import { customerLoginValidator } from '#validators/customer_login_validator'
import { loginCustomer } from '#utils/customer_session'

@inject()
export default class CustomersSessionStoreController {
  constructor(
    protected customerService: CustomerService,
    protected loginThrottleService: LoginThrottleService
  ) {}

  async handle({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(customerLoginValidator)

    try {
      const attempt = await this.loginThrottleService.attempt('customer', email, request.ip(), () =>
        this.customerService.authenticate(email, password)
      )
      if (attempt.blocked) {
        await this.customerService.recordLoginFailure('login_blocked', email, request.ip())
        return response.tooManyRequests({ error: attempt.message })
      }

      const { account, customer } = attempt.value
      if (!customer.isActive) {
        return response.badRequest({ error: 'This account has been disabled' })
      }

      await this.customerService.recordLogin(account, request.ip())
      await loginCustomer({ auth, session }, account)
      return response.ok({ data: { redirectTo: '/account' } })
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        await this.customerService.recordLoginFailure('login_failed', email, request.ip())
        return response.badRequest({ error: 'Invalid email or password' })
      }
      throw error
    }
  }
}
