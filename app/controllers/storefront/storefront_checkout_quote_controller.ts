import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CheckoutService from '#services/checkout_service'
import StorefrontMarketService from '#services/storefront_market_service'
import CheckoutQuoteTransformer from '#transformers/checkout_quote_transformer'
import { checkoutQuoteValidator } from '#validators/checkout_quote_validator'

@inject()
export default class StorefrontCheckoutQuoteController {
  constructor(
    protected checkoutService: CheckoutService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(checkoutQuoteValidator)
    const customer = await this.checkoutService.customerFor(ctx.auth.use('customer').user)
    const market = await this.storefrontMarketService.current(ctx)
    const quote = await this.checkoutService.quote(payload, customer, market, ctx.request.ip())
    return ctx.serialize(CheckoutQuoteTransformer.transform(quote))
  }
}
