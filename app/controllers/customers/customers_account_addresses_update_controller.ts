import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'
import CustomerAddressTransformer from '#transformers/customer_address_transformer'
import { customersAccountAddressUpdateValidator } from '#validators/customers_account_address_update_validator'

@inject()
export default class CustomersAccountAddressesUpdateController {
  constructor(
    protected customerService: CustomerService,
    protected customerAddressService: CustomerAddressService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(customersAccountAddressUpdateValidator)
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const address = await this.customerAddressService.findForCustomerOrFail(
      customer.id,
      ctx.params.id
    )

    const updated = await this.customerAddressService.update(address, {
      fullName: payload.fullName,
      company: payload.company,
      address1: payload.address1,
      address2: payload.address2,
      city: payload.city,
      province: payload.province,
      regionCode: payload.regionCode,
      postalCode: payload.postalCode,
      countryCode: payload.countryCode,
      phone: payload.phone,
      isDefault: payload.isDefault,
    })

    return ctx.serialize(CustomerAddressTransformer.transform(updated))
  }
}
