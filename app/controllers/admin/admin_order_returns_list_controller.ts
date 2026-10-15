import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import ReturnService from '#services/return_service'
import AdminOrderReturnsTransformer from '#transformers/admin_order_returns_transformer'

@inject()
export default class AdminOrderReturnsListController {
  constructor(
    protected orderService: OrderService,
    protected returnService: ReturnService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    const overview = await this.returnService.staffOverview(order)
    return ctx.serialize(AdminOrderReturnsTransformer.transform(overview))
  }
}
