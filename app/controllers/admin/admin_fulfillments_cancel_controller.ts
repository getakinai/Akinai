import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import FulfillmentService from '#services/fulfillment_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'

@inject()
export default class AdminFulfillmentsCancelController {
  constructor(
    protected orderService: OrderService,
    protected fulfillmentService: FulfillmentService
  ) {}

  async handle(ctx: HttpContext) {
    const fulfillment = await this.fulfillmentService.findOrFail(ctx.params.id)
    const order = await this.orderService.findOrFail(fulfillment.orderId)
    await ctx.bouncer.with(OrderPolicy).authorize('fulfill', order)

    const updated = await this.fulfillmentService.cancel(fulfillment)

    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
