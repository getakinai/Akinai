import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { adminCustomerStoreValidator } from '#validators/admin_customer_store_validator'

@inject()
export default class AdminCustomersStoreController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const { fullName, email, phone, countryCode, timezone } = await ctx.request.validateUsing(
      adminCustomerStoreValidator
    )
    const customer = await this.customerService.create({
      fullName,
      email,
      phone,
      countryCode,
      timezone,
    })
    const detail = await this.customerService.findDetail(customer.id)

    ctx.response.status(201)
    return ctx.serialize(CustomerTransformer.transform(detail).useVariant('toDetail'))
  }
}
