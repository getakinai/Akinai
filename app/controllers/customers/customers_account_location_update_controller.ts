import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import StorefrontMarketService from '#services/storefront_market_service'
import { customersAccountLocationUpdateValidator } from '#validators/customers_account_location_update_validator'

@inject()
export default class CustomersAccountLocationUpdateController {
  constructor(
    protected customerService: CustomerService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const account = ctx.auth.use('customer').getUserOrFail()
    const { countryCode, timezone, returnTo } = await ctx.request.validateUsing(
      customersAccountLocationUpdateValidator
    )

    const { market } = await this.customerService.updateLocation(account, { countryCode, timezone })
    if (market) this.storefrontMarketService.applyForCustomer(ctx, market)

    return ctx.response.ok({
      data: { redirectTo: returnTo === 'checkout' ? '/checkout' : '/account' },
    })
  }
}
