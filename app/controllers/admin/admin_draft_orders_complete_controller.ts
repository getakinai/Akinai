import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import DraftOrderService from '#services/draft_order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminDraftOrderCompleteValidator } from '#validators/admin_draft_order_complete_validator'

@inject()
export default class AdminDraftOrdersCompleteController {
  constructor(protected draftOrderService: DraftOrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.draftOrderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('complete', order)

    const { paymentStatus } = await ctx.request.validateUsing(adminDraftOrderCompleteValidator)
    const completed = await this.draftOrderService.complete(order, paymentStatus)

    return ctx.serialize(OrderTransformer.transform(completed).useVariant('toDetail'))
  }
}
