import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingService from '#services/shipping_service'
import ShippingZoneTransformer from '#transformers/shipping_zone_transformer'
import { adminShippingZonesListQueryValidator } from '#validators/admin_shipping_zones_list_query_validator'

@inject()
export default class AdminShippingListController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminShippingZonesListQueryValidator,
      { data: ctx.request.qs() }
    )
    const zones = await this.shippingService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(ShippingZoneTransformer.paginate(zones.all(), zones.getMeta()))
  }
}
