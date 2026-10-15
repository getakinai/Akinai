import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import PoliSetupTransformer from '#transformers/poli_setup_transformer'

@inject()
export default class AdminPaymentsPoliViewController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const setup = await this.paymentMethodService.poli()
    return ctx.serialize(PoliSetupTransformer.transform(setup))
  }
}
