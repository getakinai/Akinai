import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DiscountService from '#services/discount_service'
import DiscountTransformer from '#transformers/discount_transformer'

@inject()
export default class AdminDiscountsViewController {
  constructor(protected discountService: DiscountService) {}

  async handle(ctx: HttpContext) {
    const discount = await this.discountService.findOrFail(ctx.params.id)
    return ctx.serialize(DiscountTransformer.transform(discount))
  }
}
