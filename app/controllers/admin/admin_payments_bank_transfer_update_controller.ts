import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethodService from '#services/payment_method_service'
import BankTransferTransformer from '#transformers/bank_transfer_transformer'
import { adminPaymentBankTransferUpdateValidator } from '#validators/admin_payment_bank_transfer_update_validator'

@inject()
export default class AdminPaymentsBankTransferUpdateController {
  constructor(protected paymentMethodService: PaymentMethodService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminPaymentBankTransferUpdateValidator)
    const setup = await this.paymentMethodService.updateBankTransfer(ctx.params.id, payload)
    return ctx.serialize(BankTransferTransformer.transform(setup))
  }
}
