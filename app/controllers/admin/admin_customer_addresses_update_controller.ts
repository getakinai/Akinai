import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerAddressService from '#services/customer_address_service'
import CustomerService from '#services/customer_service'
import CustomerAddressTransformer from '#transformers/customer_address_transformer'
import { adminCustomerAddressParamsValidator } from '#validators/admin_customer_address_params_validator'
import { adminCustomerAddressUpdateValidator } from '#validators/admin_customer_address_update_validator'

@inject()
export default class AdminCustomerAddressesUpdateController {
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

    const payload = await ctx.request.validateUsing(adminCustomerAddressUpdateValidator)
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
