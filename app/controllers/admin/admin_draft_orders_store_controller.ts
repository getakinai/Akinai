import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DraftOrderService from '#services/draft_order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminDraftOrderStoreValidator } from '#validators/admin_draft_order_store_validator'

@inject()
export default class AdminDraftOrdersStoreController {
  constructor(protected draftOrderService: DraftOrderService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminDraftOrderStoreValidator)
    const order = await this.draftOrderService.create(payload)

    ctx.response.status(201)
    return ctx.serialize(OrderTransformer.transform(order).useVariant('toDetail'))
  }
}
