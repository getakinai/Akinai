import type { BankTransferConfig } from '#models/payment_method'
import type { CheckoutPaymentMethod } from '#services/payment_method_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** The bank account details customers need to pay by bank transfer. */
export function bankTransferDetails(bank: BankTransferConfig | null) {
  return bank
    ? {
        countryCode: bank.countryCode,
        accountName: bank.accountName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        bsb: bank.bsb,
        instructions: bank.instructions,
      }
    : null
}

/**
 * A payment method offered at checkout, with the details customers need to
 * pay (bank account for bank transfer).
 */
export default class CheckoutPaymentMethodTransformer extends BaseTransformer<CheckoutPaymentMethod> {
  toObject() {
    return {
      code: this.resource.code,
      name: this.resource.name,
      bankTransfer: bankTransferDetails(this.resource.bankTransfer),
    }
  }
}
