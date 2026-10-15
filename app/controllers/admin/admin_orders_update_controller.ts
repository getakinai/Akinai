import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminOrderUpdateValidator } from '#validators/admin_order_update_validator'

@inject()
export default class AdminOrdersUpdateController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('editPlaced', order)

    const payload = await ctx.request.validateUsing(adminOrderUpdateValidator)
    const updated = await this.orderService.updatePlaced(order, payload)

    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
