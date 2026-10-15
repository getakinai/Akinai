import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import StorefrontMarketService from '#services/storefront_market_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { customersAccountDetailsUpdateValidator } from '#validators/customers_account_details_update_validator'

@inject()
export default class CustomersAccountDetailsUpdateController {
  constructor(
    protected customerService: CustomerService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const account = ctx.auth.use('customer').getUserOrFail()
    const { fullName, email, phone, countryCode, timezone, currentPassword } =
      await ctx.request.validateUsing(customersAccountDetailsUpdateValidator, {
        meta: { customerId: account.customerId },
      })

    const { customer, market } = await this.customerService.updateOwnProfile(
      account,
      { fullName, email, phone, countryCode, timezone },
      currentPassword
    )
    if (market) this.storefrontMarketService.applyForCustomer(ctx, market)

    return ctx.serialize(CustomerTransformer.transform(customer).useVariant('toProfile'))
  }
}
