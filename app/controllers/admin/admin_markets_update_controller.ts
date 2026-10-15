import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MarketPolicy from '#policies/market_policy'
import MarketService from '#services/market_service'
import MarketTransformer from '#transformers/market_transformer'
import { adminMarketUpdateValidator } from '#validators/admin_market_update_validator'

@inject()
export default class AdminMarketsUpdateController {
  constructor(protected marketService: MarketService) {}

  async handle(ctx: HttpContext) {
    const market = await this.marketService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(MarketPolicy).authorize('update', market)

    const { name, handle, currencyCode, pricesIncludeTax, countryCodes } =
      await ctx.request.validateUsing(adminMarketUpdateValidator, {
        meta: { marketId: market.id },
      })
    const updated = await this.marketService.update(market, {
      name,
      handle,
      currencyCode,
      pricesIncludeTax,
      countryCodes,
    })

    return ctx.serialize(MarketTransformer.transform(updated))
  }
}
