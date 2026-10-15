import type { BankTransferSetup } from '#services/payment_method_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * The bank transfer setup of each active market, edited on the admin
 * Payments page.
 */
export default class BankTransferTransformer extends BaseTransformer<BankTransferSetup> {
  toObject() {
    return {
      markets: this.resource.markets.map((market) => {
        const config = market.config
        return {
          marketId: market.marketId,
          marketName: market.marketName,
          countryCodes: market.countryCodes,
          isEnabled: market.isEnabled,
          countryCode: config?.countryCode ?? null,
          accountName: config?.accountName ?? null,
          bankName: config?.bankName ?? null,
          accountNumber: config?.accountNumber ?? null,
          bsb: config?.bsb ?? null,
          instructions: config?.instructions ?? null,
        }
      }),
    }
  }
}
