import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingZonePolicy from '#policies/shipping_zone_policy'
import ShippingService from '#services/shipping_service'
import ShippingZoneTransformer from '#transformers/shipping_zone_transformer'

@inject()
export default class AdminShippingUnarchiveController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const zone = await this.shippingService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ShippingZonePolicy).authorize('unarchive', zone)

    const restored = await this.shippingService.unarchive(zone)

    return ctx.serialize(ShippingZoneTransformer.transform(restored))
  }
}
