import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingService from '#services/shipping_service'
import ShippingZoneTransformer from '#transformers/shipping_zone_transformer'

@inject()
export default class AdminShippingViewController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const zone = await this.shippingService.findDetailOrFail(ctx.params.id)
    return ctx.serialize(ShippingZoneTransformer.transform(zone).useVariant('toDetail'))
  }
}
