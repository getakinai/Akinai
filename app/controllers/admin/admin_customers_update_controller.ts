import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { adminCustomerUpdateValidator } from '#validators/admin_customer_update_validator'

@inject()
export default class AdminCustomersUpdateController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CustomerPolicy).authorize('update', customer)

    const { fullName, email, phone, countryCode, timezone } = await ctx.request.validateUsing(
      adminCustomerUpdateValidator,
      { meta: { customerId: customer.id } }
    )
    await this.customerService.update(customer, { fullName, email, phone, countryCode, timezone })
    const detail = await this.customerService.findDetail(customer.id)

    return ctx.serialize(CustomerTransformer.transform(detail).useVariant('toDetail'))
  }
}
