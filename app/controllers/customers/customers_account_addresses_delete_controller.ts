import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'

@inject()
export default class CustomersAccountAddressesDeleteController {
  constructor(
    protected customerService: CustomerService,
    protected customerAddressService: CustomerAddressService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const address = await this.customerAddressService.findForCustomerOrFail(
      customer.id,
      ctx.params.id
    )

    await this.customerAddressService.delete(address)

    return ctx.response.noContent()
  }
}
