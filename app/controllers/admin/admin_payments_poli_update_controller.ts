import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import PoliSetupTransformer from '#transformers/poli_setup_transformer'
import { adminPaymentPoliUpdateValidator } from '#validators/admin_payment_poli_update_validator'

@inject()
export default class AdminPaymentsPoliUpdateController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminPaymentPoliUpdateValidator)
    const setup = await this.paymentMethodService.updatePoli(payload)
    return ctx.serialize(PoliSetupTransformer.transform(setup))
  }
}
