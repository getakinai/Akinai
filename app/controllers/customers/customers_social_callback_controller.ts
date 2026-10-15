import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import CustomerService from '#services/customer_service'
import CustomerSocialAuthService from '#services/customer_social_auth_service'
import SocialAuthException from '#exceptions/social_auth_exception'
import { SOCIAL_INTENT_SESSION_KEY } from '#constants/social_providers'
import { customerSocialProviderValidator } from '#validators/customer_social_provider_validator'
import { loginCustomer } from '#utils/customer_session'

@inject()
export default class CustomersSocialCallbackController {
  constructor(
    protected customerService: CustomerService,
    protected customerSocialAuthService: CustomerSocialAuthService
  ) {}

  /**
   * Google/Microsoft redirect back here. Success signs the customer in and
   * goes to `/account`; anything else flashes an error on the page the
   * sign-in started from. Only a sign-in started on the Create account
   * page may create a new account.
   */
  async handle({ request, response, ally, auth, session }: HttpContext) {
    const { params } = await request.validateUsing(customerSocialProviderValidator)
    const driver = ally.use(params.provider)
    const allowSignup = session.pull(SOCIAL_INTENT_SESSION_KEY) === 'signup'

    try {
      const reason = driver.accessDenied()
        ? 'access_denied'
        : driver.stateMisMatch()
          ? 'state_mismatch'
          : driver.hasError()
            ? driver.getError()
            : null
      if (reason) {
        logger.warn(
          { event: 'customer_social_auth_failed', provider: params.provider, reason },
          'Customer social sign-in was rejected'
        )
        throw SocialAuthException.failed()
      }

      const profile = await driver.user()
      const account = await this.customerSocialAuthService.resolve(params.provider, profile, {
        allowSignup,
      })

      await this.customerService.recordLogin(account, request.ip())
      await loginCustomer({ auth, session }, account)
      return response.redirect().withQs(false).toPath('/account')
    } catch (error) {
      if (!(error instanceof SocialAuthException)) {
        logger.error({ err: error, provider: params.provider }, 'Customer social sign-in failed')
      }
      const message =
        error instanceof SocialAuthException ? error.message : SocialAuthException.failed().message
      session.flash('error', message)
      return response
        .redirect()
        .withQs(false)
        .toPath(allowSignup ? '/signup' : '/login')
    }
  }
}
