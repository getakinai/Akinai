import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingZonePolicy from '#policies/shipping_zone_policy'
import ShippingService from '#services/shipping_service'
import ShippingRateTransformer from '#transformers/shipping_rate_transformer'
import { adminShippingRateStoreValidator } from '#validators/admin_shipping_rate_store_validator'

@inject()
export default class AdminShippingRatesStoreController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const zone = await this.shippingService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ShippingZonePolicy).authorize('update', zone)

    const {
      name,
      description,
      price,
      minSubtotal,
      maxSubtotal,
      minWeight,
      maxWeight,
      minItems,
      maxItems,
      isActive,
      marketPrices,
    } = await ctx.request.validateUsing(adminShippingRateStoreValidator)
    const rate = await this.shippingService.createRate(zone, {
      name,
      description: description || null,
      price,
      minSubtotal,
      maxSubtotal,
      minWeight: minWeight ?? null,
      maxWeight: maxWeight ?? null,
      minItems: minItems ?? null,
      maxItems: maxItems ?? null,
      isActive,
      marketPrices,
    })

    ctx.response.status(201)
    return ctx.serialize(ShippingRateTransformer.transform(rate))
  }
}
