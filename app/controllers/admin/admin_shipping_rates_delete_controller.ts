import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingZonePolicy from '#policies/shipping_zone_policy'
import ShippingService from '#services/shipping_service'
import { adminShippingRateParamsValidator } from '#validators/admin_shipping_rate_params_validator'

@inject()
export default class AdminShippingRatesDeleteController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminShippingRateParamsValidator)
    const zone = await this.shippingService.findOrFail(params.zoneId)
    await ctx.bouncer.with(ShippingZonePolicy).authorize('update', zone)
    const rate = await this.shippingService.findRateForZoneOrFail(zone.id, ctx.params.id)

    await this.shippingService.deleteRate(rate)

    return ctx.response.noContent()
  }
}
