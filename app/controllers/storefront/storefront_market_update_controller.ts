import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontMarketTransformer from '#transformers/storefront_market_transformer'
import { storefrontMarketUpdateValidator } from '#validators/storefront_market_update_validator'

@inject()
export default class StorefrontMarketUpdateController {
  constructor(protected storefrontMarketService: StorefrontMarketService) {}

  async handle(ctx: HttpContext) {
    const { handle } = await ctx.request.validateUsing(storefrontMarketUpdateValidator)
    const market = await this.storefrontMarketService.choose(ctx, handle)
    if (!market) return ctx.response.notFound({ error: 'Market not found' })

    const state = await this.storefrontMarketService.state(ctx, market)
    return ctx.serialize(StorefrontMarketTransformer.transform(state))
  }
}
