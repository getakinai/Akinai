import type { PoliSetup } from '#services/payment_method_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * The POLi setup edited on the admin Payments page: the sandbox and
 * production merchant codes and which one takes payments. Authentication
 * codes are never included; only their last four characters.
 */
export default class PoliSetupTransformer extends BaseTransformer<PoliSetup> {
  toObject() {
    return {
      isEnabled: this.resource.isEnabled,
      mode: this.resource.mode,
      test: this.resource.test,
      live: this.resource.live,
      marketIds: this.resource.marketIds,
    }
  }
}
