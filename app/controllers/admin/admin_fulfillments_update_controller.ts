import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import FulfillmentService from '#services/fulfillment_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminFulfillmentTrackingUpdateValidator } from '#validators/admin_fulfillment_tracking_update_validator'

@inject()
export default class AdminFulfillmentsUpdateController {
  constructor(
    protected orderService: OrderService,
    protected fulfillmentService: FulfillmentService
  ) {}

  async handle(ctx: HttpContext) {
    const fulfillment = await this.fulfillmentService.findOrFail(ctx.params.id)
    const order = await this.orderService.findOrFail(fulfillment.orderId)
    await ctx.bouncer.with(OrderPolicy).authorize('fulfill', order)

    const payload = await ctx.request.validateUsing(adminFulfillmentTrackingUpdateValidator)
    const updated = await this.fulfillmentService.updateTracking(fulfillment, payload)

    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
