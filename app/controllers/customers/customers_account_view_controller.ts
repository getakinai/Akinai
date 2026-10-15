import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'

@inject()
export default class CustomersAccountViewController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const account = ctx.auth.use('customer').getUserOrFail()
    const customer = await this.customerService.profileFor(account)
    return ctx.serialize(CustomerTransformer.transform(customer).useVariant('toProfile'))
  }
}
