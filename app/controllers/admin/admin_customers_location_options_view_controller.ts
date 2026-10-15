import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerLocationOptionsTransformer from '#transformers/customer_location_options_transformer'

@inject()
export default class AdminCustomersLocationOptionsViewController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const options = await this.customerService.locationOptions()
    return ctx.serialize(CustomerLocationOptionsTransformer.transform(options))
  }
}
