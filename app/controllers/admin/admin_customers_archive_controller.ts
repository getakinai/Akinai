import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'

@inject()
export default class AdminCustomersArchiveController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CustomerPolicy).authorize('archive', customer)

    await this.customerService.archive(customer)
    const detail = await this.customerService.findDetail(customer.id)

    return ctx.serialize(CustomerTransformer.transform(detail).useVariant('toDetail'))
  }
}
