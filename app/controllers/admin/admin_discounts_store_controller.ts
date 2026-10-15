import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import DiscountService from '#services/discount_service'
import DiscountTransformer from '#transformers/discount_transformer'
import { adminDiscountStoreValidator } from '#validators/admin_discount_store_validator'

@inject()
export default class AdminDiscountsStoreController {
  constructor(protected discountService: DiscountService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminDiscountStoreValidator)
    const discount = await this.discountService.create({
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

    ctx.response.status(201)
    return ctx.serialize(DiscountTransformer.transform(discount))
  }
}
