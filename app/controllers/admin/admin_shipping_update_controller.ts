import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingZonePolicy from '#policies/shipping_zone_policy'
import ShippingService from '#services/shipping_service'
import ShippingZoneTransformer from '#transformers/shipping_zone_transformer'
import { adminShippingZoneUpdateValidator } from '#validators/admin_shipping_zone_update_validator'

@inject()
export default class AdminShippingUpdateController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const zone = await this.shippingService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ShippingZonePolicy).authorize('update', zone)

    const { name, countryCodes, regionCodes } = await ctx.request.validateUsing(
      adminShippingZoneUpdateValidator,
      { meta: { shippingZoneId: zone.id } }
    )
    const updated = await this.shippingService.update(zone, { name, countryCodes, regionCodes })

    return ctx.serialize(ShippingZoneTransformer.transform(updated).useVariant('toDetail'))
  }
}
