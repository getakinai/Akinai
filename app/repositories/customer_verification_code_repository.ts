import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import CustomerVerificationCode, {
  type SignupVerificationPayload,
} from '#models/customer_verification_code'
import type { VerificationPurpose } from '#constants/customer_verification'

const TABLE = 'customer_verification_codes'

export type IssueVerificationCodeData = {
  email: string
  purpose: VerificationPurpose
  codeHash: string
  payload: SignupVerificationPayload | null
  expiresAt: DateTime
}

export default class CustomerVerificationCodeRepository {
  /**
   * Replaces any unconsumed code for the same email and purpose, so only
   * the newest code works.
   */
  async issue(data: IssueVerificationCodeData): Promise<CustomerVerificationCode> {
    return db.transaction(async (trx) => {
      await CustomerVerificationCode.query({ client: trx })
        .where('email', data.email)
        .where('purpose', data.purpose)
        .whereNull('consumed_at')
        .delete()

      return CustomerVerificationCode.create(
        { ...data, attempts: 0, consumedAt: null, lastSentAt: DateTime.now() },
        { client: trx }
      )
    })
  }

  /**
   * The unconsumed, unexpired code with this id and purpose.
   */
  async findActive(
    id: string,
    purpose: VerificationPurpose
  ): Promise<CustomerVerificationCode | null> {
    return CustomerVerificationCode.query()
      .where('id', id)
      .where('purpose', purpose)
      .whereNull('consumed_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()
  }

  /**
   * Counts a wrong guess. Returns the new count, or null when the code had
   * already used up `maxAttempts` (checked in the same statement, so
   * parallel guesses can't go over the limit).
   */
  async incrementAttempts(id: string, maxAttempts: number): Promise<number | null> {
    const rows: { attempts: number }[] = await db
      .from(TABLE)
      .where('id', id)
      .where('attempts', '<', maxAttempts)
      .update({ attempts: db.knexRawQuery('attempts + 1'), updated_at: new Date() }, ['attempts'])
    return rows[0]?.attempts ?? null
  }

  /**
   * Marks the code used. Returns false when another request consumed it
   * first, so a code can only ever be used once.
   */
  async consume(id: string): Promise<boolean> {
    const rows = await db
      .from(TABLE)
      .where('id', id)
      .whereNull('consumed_at')
      .update({ consumed_at: new Date(), updated_at: new Date() }, ['id'])
    return rows.length > 0
  }

  /**
   * A new code for the same pending verification (resend).
   */
  async refresh(
    record: CustomerVerificationCode,
    codeHash: string,
    expiresAt: DateTime
  ): Promise<CustomerVerificationCode> {
    return record.merge({ codeHash, expiresAt, attempts: 0, lastSentAt: DateTime.now() }).save()
  }

  /**
   * Removes codes that expired or were used more than a day ago.
   */
  async deleteExpired(): Promise<number> {
    const cutoff = DateTime.now().minus({ days: 1 }).toSQL()
    const rows = await db
      .from(TABLE)
      .where((query) => query.where('expires_at', '<', cutoff).orWhere('consumed_at', '<', cutoff))
      .delete(['id'])
    return rows.length
  }
}
