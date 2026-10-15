import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPaymentProofService from '#services/order_payment_proof_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminOrderPaymentProofReviewValidator } from '#validators/admin_order_payment_proof_review_validator'

@inject()
export default class AdminOrderPaymentProofReviewUpdateController {
  constructor(
    protected orderService: OrderService,
    protected orderPaymentProofService: OrderPaymentProofService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminOrderPaymentProofReviewValidator)
    const order = await this.orderService.findOrFail(ctx.params.id)
    const user = ctx.auth.use('web').getUserOrFail()

    await this.orderPaymentProofService.review(
      order,
      user.id,
      payload.decision === 'reject'
        ? { decision: 'reject', reason: payload.reason ?? '' }
        : { decision: 'approve' }
    )

    const updated = await this.orderService.findDetailOrFail(order.id)
    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
