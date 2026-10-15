import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'
import CustomerAddressTransformer from '#transformers/customer_address_transformer'

@inject()
export default class CustomersAccountAddressesListController {
  constructor(
    protected customerService: CustomerService,
    protected customerAddressService: CustomerAddressService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const addresses = await this.customerAddressService.listFor(customer)
    return ctx.serialize(CustomerAddressTransformer.transform(addresses))
  }
}
