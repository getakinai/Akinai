import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { customersAccountMarketingUpdateValidator } from '#validators/customers_account_marketing_update_validator'

@inject()
export default class CustomersAccountMarketingUpdateController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const account = ctx.auth.use('customer').getUserOrFail()
    const { acceptsMarketing } = await ctx.request.validateUsing(
      customersAccountMarketingUpdateValidator
    )
    const customer = await this.customerService.updateOwnMarketing(account, acceptsMarketing)

    return ctx.serialize(CustomerTransformer.transform(customer).useVariant('toProfile'))
  }
}
