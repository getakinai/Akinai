import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerFilterOptionsTransformer from '#transformers/customer_filter_options_transformer'

@inject()
export default class AdminCustomersFilterOptionsViewController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const options = await this.customerService.filterOptions()
    return ctx.serialize(CustomerFilterOptionsTransformer.transform(options))
  }
}
