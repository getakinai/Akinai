import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import PaymentMethodListTransformer from '#transformers/payment_method_list_transformer'

@inject()
export default class AdminPaymentsListController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const methods = await this.paymentMethodService.list()
    return ctx.serialize(PaymentMethodListTransformer.transform(methods))
  }
}
