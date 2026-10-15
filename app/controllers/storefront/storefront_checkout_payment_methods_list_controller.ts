import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import StorefrontMarketService from '#services/storefront_market_service'
import CheckoutPaymentMethodTransformer from '#transformers/checkout_payment_method_transformer'

@inject()
export default class StorefrontCheckoutPaymentMethodsListController {
  constructor(
    protected paymentMethodService: PaymentMethodService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const market = await this.storefrontMarketService.current(ctx)
    const methods = await this.paymentMethodService.enabledForCheckout(market)
    return ctx.serialize(CheckoutPaymentMethodTransformer.transform(methods))
  }
}
