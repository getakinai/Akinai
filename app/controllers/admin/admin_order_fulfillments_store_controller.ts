import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import FulfillmentService from '#services/fulfillment_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminFulfillmentStoreValidator } from '#validators/admin_fulfillment_store_validator'

@inject()
export default class AdminOrderFulfillmentsStoreController {
  constructor(
    protected orderService: OrderService,
    protected fulfillmentService: FulfillmentService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('fulfill', order)

    const payload = await ctx.request.validateUsing(adminFulfillmentStoreValidator)
    const updated = await this.fulfillmentService.fulfill(order, payload)

    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
