import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import FulfillmentService from '#services/fulfillment_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminOrderFulfillmentStatusUpdateValidator } from '#validators/admin_order_fulfillment_status_update_validator'

@inject()
export default class AdminOrdersFulfillmentStatusUpdateController {
  constructor(
    protected orderService: OrderService,
    protected fulfillmentService: FulfillmentService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('fulfill', order)

    const { status } = await ctx.request.validateUsing(adminOrderFulfillmentStatusUpdateValidator)
    const updated = await this.fulfillmentService.setStatus(order, status)

    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
