import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'

@inject()
export default class AdminOrdersArchiveController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('archive', order)

    const archived = await this.orderService.archive(order)

    return ctx.serialize(OrderTransformer.transform(archived).useVariant('toDetail'))
  }
}
