import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderService from '#services/order_service'
import CustomerOrderTransformer from '#transformers/customer_order_transformer'
import { customersAccountOrdersListQueryValidator } from '#validators/customers_account_orders_list_query_validator'

@inject()
export default class CustomersAccountOrdersListController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService
  ) {}

  async handle(ctx: HttpContext) {
    const { page, perPage } = await ctx.request.validateUsing(
      customersAccountOrdersListQueryValidator,
      { data: ctx.request.qs() }
    )
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const orders = await this.orderService.paginateForCustomer(customer.id, page, perPage)

    return ctx.serialize(CustomerOrderTransformer.paginate(orders.all(), orders.getMeta()))
  }
}
