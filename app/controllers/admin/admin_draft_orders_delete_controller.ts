import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import DraftOrderService from '#services/draft_order_service'

@inject()
export default class AdminDraftOrdersDeleteController {
  constructor(protected draftOrderService: DraftOrderService) {}

  async handle(ctx: HttpContext) {
    const order = await this.draftOrderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('delete', order)

    await this.draftOrderService.delete(order)

    return ctx.response.noContent()
  }
}
