import type { PaymentMethodListItem } from '#services/payment_method_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * One row on the admin Payments page.
 */
export default class PaymentMethodListTransformer extends BaseTransformer<PaymentMethodListItem> {
  toObject() {
    return {
      code: this.resource.code,
      name: this.resource.name,
      description: this.resource.description,
      regions: [...this.resource.regions],
      status: this.resource.status,
      isEnabled: this.resource.isEnabled,
      configured: this.resource.configured,
      mode: this.resource.mode,
      markets: this.resource.markets.map((market) => ({ id: market.id, name: market.name })),
    }
  }
}
