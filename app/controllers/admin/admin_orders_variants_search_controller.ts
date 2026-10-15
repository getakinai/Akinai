import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import OrderVariantOptionTransformer from '#transformers/order_variant_option_transformer'
import { adminOrderVariantsSearchQueryValidator } from '#validators/admin_order_variants_search_query_validator'

@inject()
export default class AdminOrdersVariantsSearchController {
  constructor(protected orderService: OrderService) {}

  async handle(ctx: HttpContext) {
    const { q } = await ctx.request.validateUsing(adminOrderVariantsSearchQueryValidator, {
      data: ctx.request.qs(),
    })
    const variants = await this.orderService.searchVariants(q)
    return ctx.serialize(OrderVariantOptionTransformer.transform(variants))
  }
}
