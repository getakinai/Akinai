import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { adminCustomerMarketingUpdateValidator } from '#validators/admin_customer_marketing_update_validator'

@inject()
export default class AdminCustomersMarketingUpdateController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CustomerPolicy).authorize('update', customer)

    const { acceptsMarketing } = await ctx.request.validateUsing(
      adminCustomerMarketingUpdateValidator
    )
    const detail = await this.customerService.setMarketing(customer, acceptsMarketing)

    return ctx.serialize(CustomerTransformer.transform(detail).useVariant('toDetail'))
  }
}
