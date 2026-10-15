import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderService from '#services/order_service'
import ReturnService from '#services/return_service'
import CustomerOrderReturnsTransformer from '#transformers/customer_order_returns_transformer'

@inject()
export default class CustomersAccountOrderReturnsListController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected returnService: ReturnService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)
    const overview = await this.returnService.customerOverview(order)
    return ctx.serialize(CustomerOrderReturnsTransformer.transform(overview))
  }
}
