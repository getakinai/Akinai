import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import DraftOrderService from '#services/draft_order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminDraftOrderUpdateValidator } from '#validators/admin_draft_order_update_validator'

@inject()
export default class AdminDraftOrdersUpdateController {
  constructor(protected draftOrderService: DraftOrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.draftOrderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('update', order)

    const payload = await ctx.request.validateUsing(adminDraftOrderUpdateValidator)
    const updated = await this.draftOrderService.update(order, payload)

    return ctx.serialize(OrderTransformer.transform(updated).useVariant('toDetail'))
  }
}
