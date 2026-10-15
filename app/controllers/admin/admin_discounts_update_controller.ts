import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DiscountPolicy from '#policies/discount_policy'
import DiscountService from '#services/discount_service'
import DiscountTransformer from '#transformers/discount_transformer'
import { adminDiscountUpdateValidator } from '#validators/admin_discount_update_validator'

@inject()
export default class AdminDiscountsUpdateController {
  constructor(protected discountService: DiscountService) {}

  async handle(ctx: HttpContext) {
    const discount = await this.discountService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(DiscountPolicy).authorize('update', discount)

    const payload = await ctx.request.validateUsing(adminDiscountUpdateValidator, {
      meta: { discountId: discount.id },
    })
    const updated = await this.discountService.update(discount, {
      title: payload.title,
      type: payload.type,
      code: payload.code,
      method: payload.method,
      valueType: payload.valueType,
      value: payload.value,
      appliesTo: payload.appliesTo,
      productIds: payload.productIds,
      collectionIds: payload.collectionIds,
      buyRequirement: payload.buyRequirement,
      buyValue: payload.buyValue,
      buyAppliesTo: payload.buyAppliesTo,
      buyProductIds: payload.buyProductIds,
      buyCollectionIds: payload.buyCollectionIds,
      getQuantity: payload.getQuantity,
      maxUsesPerOrder: payload.maxUsesPerOrder,
      maxShippingPrice: payload.maxShippingPrice,
      minSubtotal: payload.minSubtotal,
      usageLimit: payload.usageLimit,
      oncePerCustomer: payload.oncePerCustomer,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    })

    return ctx.serialize(DiscountTransformer.transform(updated))
  }
}
