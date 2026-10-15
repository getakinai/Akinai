import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHomeService from '#services/storefront_home_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontHomeTransformer from '#transformers/storefront_home_transformer'

@inject()
export default class StorefrontHomeViewController {
  constructor(
    protected storefrontHomeService: StorefrontHomeService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const market = await this.storefrontMarketService.current(ctx)
    const home = await this.storefrontHomeService.get(market)
    return ctx.serialize(StorefrontHomeTransformer.transform(home))
  }
}
