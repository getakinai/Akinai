import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import StripeSetupTransformer from '#transformers/stripe_setup_transformer'
import { adminPaymentStripeUpdateValidator } from '#validators/admin_payment_stripe_update_validator'

@inject()
export default class AdminPaymentsStripeUpdateController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminPaymentStripeUpdateValidator)
    const setup = await this.paymentMethodService.updateStripe(payload)
    return ctx.serialize(StripeSetupTransformer.transform(setup))
  }
}
