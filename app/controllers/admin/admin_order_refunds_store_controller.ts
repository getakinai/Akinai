import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import RefundService from '#services/refund_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminOrderRefundStoreValidator } from '#validators/admin_order_refund_store_validator'

@inject()
export default class AdminOrderRefundsStoreController {
  constructor(
    protected orderService: OrderService,
    protected refundService: RefundService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('refund', order)

    const payload = await ctx.request.validateUsing(adminOrderRefundStoreValidator)
    const user = ctx.auth.use('web').getUserOrFail()
    await this.refundService.create(order, payload, user.id)

    const updated = await this.orderService.findDetailOrFail(order.id)
    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
