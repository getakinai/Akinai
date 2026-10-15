import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * The signed-in User's two-step verification status. Never includes the
 * secret or the recovery code hashes.
 */
export default class UserMfaTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      enabled: this.resource.mfaEnabled,
      enabledAt: this.resource.mfaEnabledAt?.toISO() ?? null,
      recoveryCodesRemaining: this.resource.mfaRecoveryCodes?.length ?? 0,
    }
  }
}
