import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PriceService from '#services/price_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontCartPricesTransformer from '#transformers/storefront_cart_prices_transformer'
import { storefrontCartPricesValidator } from '#validators/storefront_cart_prices_validator'

@inject()
export default class StorefrontCartPricesUpdateController {
  constructor(
    protected priceService: PriceService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const { variantIds } = await ctx.request.validateUsing(storefrontCartPricesValidator)
    const market = await this.storefrontMarketService.current(ctx)
    const prices = await this.priceService.cartPrices(variantIds, market)
    return ctx.serialize(
      StorefrontCartPricesTransformer.transform({ market: market.handle, prices })
    )
  }
}
