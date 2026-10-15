import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'
import { adminCustomerAddressParamsValidator } from '#validators/admin_customer_address_params_validator'

@inject()
export default class AdminCustomerAddressesDeleteController {
  constructor(
    protected customerService: CustomerService,
    protected customerAddressService: CustomerAddressService
  ) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminCustomerAddressParamsValidator)
    const customer = await this.customerService.findOrFail(params.customerId)
    await ctx.bouncer.with(CustomerPolicy).authorize('update', customer)
    const address = await this.customerAddressService.findForCustomerOrFail(
      customer.id,
      ctx.params.id
    )

    await this.customerAddressService.delete(address)

    return ctx.response.noContent()
  }
}
