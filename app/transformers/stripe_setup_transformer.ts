import type { StripeSetup } from '#services/payment_method_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * The Stripe setup edited on the admin Payments page: the sandbox and
 * production keys and which one takes payments. Secrets are never
 * included; only the last four characters of each secret key.
 */
export default class StripeSetupTransformer extends BaseTransformer<StripeSetup> {
  toObject() {
    return {
      isEnabled: this.resource.isEnabled,
      mode: this.resource.mode,
      test: this.resource.test,
      live: this.resource.live,
      cancelUrl: this.resource.cancelUrl,
      marketIds: this.resource.marketIds,
    }
  }
}
