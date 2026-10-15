import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontMarketTransformer from '#transformers/storefront_market_transformer'

@inject()
export default class StorefrontMarketViewController {
  constructor(protected storefrontMarketService: StorefrontMarketService) {}

  async handle(ctx: HttpContext) {
    const state = await this.storefrontMarketService.state(ctx)
    return ctx.serialize(StorefrontMarketTransformer.transform(state))
  }
}
