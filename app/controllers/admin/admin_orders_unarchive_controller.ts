import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'

@inject()
export default class AdminOrdersUnarchiveController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('unarchive', order)

    const restored = await this.orderService.unarchive(order)

    return ctx.serialize(OrderTransformer.transform(restored).useVariant('toDetail'))
  }
}
