import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderCancelService from '#services/order_cancel_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminOrderCancelValidator } from '#validators/admin_order_cancel_validator'

@inject()
export default class AdminOrdersCancelController {
  constructor(
    protected orderService: OrderService,
    protected orderCancelService: OrderCancelService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('cancel', order)

    const payload = await ctx.request.validateUsing(adminOrderCancelValidator)
    const user = ctx.auth.use('web').getUserOrFail()
    const cancelled = await this.orderCancelService.cancel(order, payload, user.id)

    return ctx.serialize(OrderTransformer.transform(cancelled).useVariant('toDetail'))
  }
}
