import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

/**
 * MFA writes for staff Users. Callers record their own security audit
 * event, so these saves skip the generic `updated` entry.
 */
export default class UserMfaRepository {
  async enable(user: User, encryptedSecret: string, recoveryCodeHashes: string[]): Promise<User> {
    user.$skipAudit = true
    return user
      .merge({
        mfaSecret: encryptedSecret,
        mfaEnabledAt: DateTime.now(),
        mfaRecoveryCodes: recoveryCodeHashes,
        mfaLastTimeStep: null,
      })
      .save()
  }

  /**
   * Turns MFA off and bumps `sessionVersion`, which signs out every other
   * session of this User.
   */
  async disable(user: User): Promise<User> {
    user.$skipAudit = true
    return user
      .merge({
        mfaSecret: null,
        mfaEnabledAt: null,
        mfaRecoveryCodes: null,
        mfaLastTimeStep: null,
        sessionVersion: user.sessionVersion + 1,
      })
      .save()
  }

  /**
   * Records the accepted TOTP time step. Returns false when this step (or a
   * later one) was already used, so a code can't be replayed, even by two
   * requests racing each other.
   */
  async claimTimeStep(userId: string, timeStep: number): Promise<boolean> {
    const updated = await User.query()
      .where('id', userId)
      .where((query) => {
        query.whereNull('mfa_last_time_step').orWhere('mfa_last_time_step', '<', timeStep)
      })
      .update({ mfa_last_time_step: timeStep })
    return Number(Array.isArray(updated) ? updated[0] : updated) > 0
  }

  /**
   * Removes the first stored recovery code hash that `matches` accepts.
   * Locks the row so a code can only be used once. Returns false when no
   * code matched.
   */
  async consumeRecoveryCode(userId: string, matches: (hash: string) => boolean): Promise<boolean> {
    return db.transaction(async (trx) => {
      const user = await User.query({ client: trx }).where('id', userId).forUpdate().firstOrFail()
      const codes = user.mfaRecoveryCodes ?? []
      const index = codes.findIndex(matches)
      if (index === -1) return false

      user.$skipAudit = true
      await user.merge({ mfaRecoveryCodes: codes.filter((_, i) => i !== index) }).save()
      return true
    })
  }
}
