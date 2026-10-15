import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingService from '#services/shipping_service'
import ShippingZoneRegionTransformer from '#transformers/shipping_zone_region_transformer'

@inject()
export default class AdminShippingRegionsListController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const regions = await this.shippingService.listRegions()
    return ctx.serialize(ShippingZoneRegionTransformer.transform(regions))
  }
}
