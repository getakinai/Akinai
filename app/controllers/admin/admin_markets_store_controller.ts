import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MarketService from '#services/market_service'
import MarketTransformer from '#transformers/market_transformer'
import { adminMarketStoreValidator } from '#validators/admin_market_store_validator'

@inject()
export default class AdminMarketsStoreController {
  constructor(protected marketService: MarketService) {}

  async handle(ctx: HttpContext) {
    const { name, currencyCode, pricesIncludeTax, countryCodes } =
      await ctx.request.validateUsing(adminMarketStoreValidator)
    const market = await this.marketService.create({
      name,
      currencyCode,
      pricesIncludeTax,
      countryCodes,
    })

    ctx.response.status(201)
    return ctx.serialize(MarketTransformer.transform(market))
  }
}
