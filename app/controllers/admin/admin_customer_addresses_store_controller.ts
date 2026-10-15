import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'
import CustomerAddressTransformer from '#transformers/customer_address_transformer'
import { adminCustomerAddressStoreValidator } from '#validators/admin_customer_address_store_validator'

@inject()
export default class AdminCustomerAddressesStoreController {
  constructor(
    protected customerService: CustomerService,
    protected customerAddressService: CustomerAddressService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CustomerPolicy).authorize('update', customer)

    const payload = await ctx.request.validateUsing(adminCustomerAddressStoreValidator)
    const address = await this.customerAddressService.create(customer, {
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

    ctx.response.status(201)
    return ctx.serialize(CustomerAddressTransformer.transform(address))
  }
}
