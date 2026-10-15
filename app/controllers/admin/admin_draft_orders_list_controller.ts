import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { adminDraftOrdersListQueryValidator } from '#validators/admin_draft_orders_list_query_validator'

@inject()
export default class AdminDraftOrdersListController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const { q, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminDraftOrdersListQueryValidator,
      { data: ctx.request.qs() }
    )
    const drafts = await this.orderService.paginateDrafts({ q, sort, direction, page, perPage })

    return ctx.serialize(OrderTransformer.paginate(drafts.all(), drafts.getMeta()))
  }
}
