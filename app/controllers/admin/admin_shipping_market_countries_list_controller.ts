import { inject } from '@adonisjs/core'
import ShippingService from '#services/shipping_service'

/**
 * Countries covered by active markets, so the zone page can flag
 * destinations where customers can't order.
 */
@inject()
export default class AdminShippingMarketCountriesListController {
  constructor(protected shippingService: ShippingService) {}

  async handle() {
    return { data: { countryCodes: await this.shippingService.marketCountryCodes() } }
  }
}
