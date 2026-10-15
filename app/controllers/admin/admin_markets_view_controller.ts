import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MarketService from '#services/market_service'
import MarketTransformer from '#transformers/market_transformer'

@inject()
export default class AdminMarketsViewController {
  constructor(protected marketService: MarketService) {}

  async handle(ctx: HttpContext) {
    const market = await this.marketService.findDetailOrFail(ctx.params.id)
    return ctx.serialize(MarketTransformer.transform(market))
  }
}
