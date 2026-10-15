import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import StripeSetupTransformer from '#transformers/stripe_setup_transformer'

@inject()
export default class AdminPaymentsStripeViewController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const setup = await this.paymentMethodService.stripe()
    return ctx.serialize(StripeSetupTransformer.transform(setup))
  }
}
