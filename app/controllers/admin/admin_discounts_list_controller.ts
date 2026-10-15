import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DiscountService from '#services/discount_service'
import DiscountTransformer from '#transformers/discount_transformer'
import { adminDiscountsListQueryValidator } from '#validators/admin_discounts_list_query_validator'

@inject()
export default class AdminDiscountsListController {
  constructor(protected discountService: DiscountService) {}

  async handle(ctx: HttpContext) {
    const { q, status, type, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminDiscountsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const discounts = await this.discountService.paginate({
      q,
      status,
      type,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(DiscountTransformer.paginate(discounts.all(), discounts.getMeta()))
  }
}
