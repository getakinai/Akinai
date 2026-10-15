import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { adminCustomersListQueryValidator } from '#validators/admin_customers_list_query_validator'

@inject()
export default class AdminCustomersListController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminCustomersListQueryValidator, {
      data: ctx.request.qs(),
    })
    const customers = await this.customerService.paginate(filters)

    return ctx.serialize(CustomerTransformer.paginate(customers.all(), customers.getMeta()))
  }
}
