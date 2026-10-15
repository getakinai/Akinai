import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminOrdersListQueryValidator } from '#validators/admin_orders_list_query_validator'

@inject()
export default class AdminOrdersListController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminOrdersListQueryValidator, {
      data: ctx.request.qs(),
    })
    const orders = await this.orderService.paginateOrders(filters)

    return ctx.serialize(OrderTransformer.paginate(orders.all(), orders.getMeta()))
  }
}
