import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import PaymentMarketTransformer from '#transformers/payment_market_transformer'

@inject()
export default class AdminPaymentsMarketsListController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const markets = await this.paymentMethodService.markets()
    return ctx.serialize(PaymentMarketTransformer.transform(markets))
  }
}
