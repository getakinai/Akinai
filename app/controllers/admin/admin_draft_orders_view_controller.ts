import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'

@inject()
export default class AdminDraftOrdersViewController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findDetailOrFail(ctx.params.id)
    return ctx.serialize(OrderTransformer.transform(order).useVariant('toDetail'))
  }
}
