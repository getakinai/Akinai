import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import BankTransferTransformer from '#transformers/bank_transfer_transformer'

@inject()
export default class AdminPaymentsBankTransferViewController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const setup = await this.paymentMethodService.bankTransfer()
    return ctx.serialize(BankTransferTransformer.transform(setup))
  }
}
