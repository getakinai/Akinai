import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingZonePolicy from '#policies/shipping_zone_policy'
import ShippingService from '#services/shipping_service'
import ShippingRateTransformer from '#transformers/shipping_rate_transformer'
import { adminShippingRateParamsValidator } from '#validators/admin_shipping_rate_params_validator'
import { adminShippingRateUpdateValidator } from '#validators/admin_shipping_rate_update_validator'

@inject()
export default class AdminShippingRatesUpdateController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminShippingRateParamsValidator)
    const zone = await this.shippingService.findOrFail(params.zoneId)
    await ctx.bouncer.with(ShippingZonePolicy).authorize('update', zone)
    const rate = await this.shippingService.findRateForZoneOrFail(zone.id, ctx.params.id)

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
    } = await ctx.request.validateUsing(adminShippingRateUpdateValidator)
    const updated = await this.shippingService.updateRate(rate, {
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

    return ctx.serialize(ShippingRateTransformer.transform(updated))
  }
}
