import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MarketPolicy from '#policies/market_policy'
import MarketService from '#services/market_service'
import MarketTransformer from '#transformers/market_transformer'

@inject()
export default class AdminMarketsUnarchiveController {
  constructor(protected marketService: MarketService) {}

  async handle(ctx: HttpContext) {
    const market = await this.marketService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(MarketPolicy).authorize('unarchive', market)

    const restored = await this.marketService.unarchive(market)

    return ctx.serialize(MarketTransformer.transform(restored))
  }
}
