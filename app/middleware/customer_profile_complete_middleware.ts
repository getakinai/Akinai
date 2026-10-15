import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import CustomerService from '#services/customer_service'

type ProfileCompleteOptions = {
  /** Where the welcome step sends the customer once their country is saved. */
  returnTo?: 'account' | 'checkout'
}

/**
 * Signed-in customers must pick their country before using their account or
 * checking out. Guests pass through, so it is safe on guest checkout routes.
 */
@inject()
export default class CustomerProfileCompleteMiddleware {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext, next: NextFn, options: ProfileCompleteOptions = {}) {
    const account = ctx.auth.use('customer').user
    if (!account) return next()

    const customer = await this.customerService.profileFor(account)
    if (customer.countryCode) return next()

    const message = 'Choose your country to continue'
    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.forbidden({ errors: [{ message, code: 'E_PROFILE_INCOMPLETE' }] })
    }
    return ctx.response
      .redirect()
      .toRoute(
        'customers.account.welcome.create',
        {},
        { qs: options.returnTo === 'checkout' ? { return_to: 'checkout' } : {} }
      )
  }
}
