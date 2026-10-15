import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductSearchService from '#services/product_search_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontProductCardTransformer from '#transformers/storefront_product_card_transformer'
import { storefrontSearchQueryValidator } from '#validators/storefront_search_query_validator'

@inject()
export default class StorefrontSearchListController {
  constructor(
    protected productSearchService: ProductSearchService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const { q } = await ctx.request.validateUsing(storefrontSearchQueryValidator, {
      data: ctx.request.qs(),
    })
    const market = await this.storefrontMarketService.current(ctx)
    const products = await this.productSearchService.search(q, market)
    return ctx.serialize(StorefrontProductCardTransformer.transform(products))
  }
}
