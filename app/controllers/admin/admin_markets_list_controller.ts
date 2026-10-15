import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MarketService from '#services/market_service'
import MarketTransformer from '#transformers/market_transformer'
import { adminMarketsListQueryValidator } from '#validators/admin_markets_list_query_validator'

@inject()
export default class AdminMarketsListController {
  constructor(protected marketService: MarketService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminMarketsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const markets = await this.marketService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(MarketTransformer.paginate(markets.all(), markets.getMeta()))
  }
}
