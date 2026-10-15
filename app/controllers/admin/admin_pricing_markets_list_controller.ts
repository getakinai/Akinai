import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PriceService from '#services/price_service'
import PricingMarketTransformer from '#transformers/pricing_market_transformer'

/**
 * The primary market (base prices) and the markets that need their own
 * prices on variants and shipping rates.
 */
@inject()
export default class AdminPricingMarketsListController {
  constructor(protected priceService: PriceService) {}

  async handle(ctx: HttpContext) {
    const markets = await this.priceService.pricingMarketsWithPrimary()

    return ctx.serialize(PricingMarketTransformer.transform(markets))
  }
}
