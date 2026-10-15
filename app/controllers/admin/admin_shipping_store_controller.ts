import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ShippingService from '#services/shipping_service'
import ShippingZoneTransformer from '#transformers/shipping_zone_transformer'
import { adminShippingZoneStoreValidator } from '#validators/admin_shipping_zone_store_validator'

@inject()
export default class AdminShippingStoreController {
  constructor(protected shippingService: ShippingService) {}

  async handle(ctx: HttpContext) {
    const { name, countryCodes, regionCodes } = await ctx.request.validateUsing(
      adminShippingZoneStoreValidator
    )
    const zone = await this.shippingService.create({ name, countryCodes, regionCodes })

    ctx.response.status(201)
    return ctx.serialize(ShippingZoneTransformer.transform(zone).useVariant('toDetail'))
  }
}
