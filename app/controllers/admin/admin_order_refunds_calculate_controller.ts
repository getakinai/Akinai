import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import RefundService from '#services/refund_service'
import RefundQuoteTransformer from '#transformers/refund_quote_transformer'
import { adminOrderRefundCalculateValidator } from '#validators/admin_order_refund_calculate_validator'

@inject()
export default class AdminOrderRefundsCalculateController {
  constructor(
    protected orderService: OrderService,
    protected refundService: RefundService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('refund', order)

    const payload = await ctx.request.validateUsing(adminOrderRefundCalculateValidator)
    const quote = await this.refundService.calculate(order, payload)

    return ctx.serialize(RefundQuoteTransformer.transform(quote))
  }
}
