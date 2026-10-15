import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DraftOrderService from '#services/draft_order_service'
import DraftOrderQuoteTransformer from '#transformers/draft_order_quote_transformer'
import { adminDraftOrderCalculateValidator } from '#validators/admin_draft_order_calculate_validator'

@inject()
export default class AdminDraftOrdersCalculateController {
  constructor(protected draftOrderService: DraftOrderService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminDraftOrderCalculateValidator)
    const quote = await this.draftOrderService.calculate(payload)
    return ctx.serialize(DraftOrderQuoteTransformer.transform(quote))
  }
}
