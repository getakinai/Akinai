import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DiscountPolicy from '#policies/discount_policy'
import DiscountService from '#services/discount_service'
import DiscountTransformer from '#transformers/discount_transformer'

@inject()
export default class AdminDiscountsUnarchiveController {
  constructor(protected discountService: DiscountService) {}

  async handle(ctx: HttpContext) {
    const discount = await this.discountService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(DiscountPolicy).authorize('unarchive', discount)

    const restored = await this.discountService.unarchive(discount)

    return ctx.serialize(DiscountTransformer.transform(restored))
  }
}
