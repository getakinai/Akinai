import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'

@inject()
export default class AdminCustomersViewController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.findDetail(ctx.params.id)
    return ctx.serialize(CustomerTransformer.transform(customer).useVariant('toDetail'))
  }
}
