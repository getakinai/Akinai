import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import type { CreateUserData } from '#repositories/user_repository'

/** Fixed key for the first-run setup advisory lock. */
const SETUP_LOCK_KEY = 7_412_001

export default class SetupRepository {
  async hasAnyUser(): Promise<boolean> {
    const user = await User.query().select('id').first()
    return user !== null
  }

  /**
   * Creates the first staff User, or returns null when one already exists.
   * The transaction-scoped advisory lock serializes concurrent setup
   * requests, so two of them can never both create an admin.
   */
  async createFirstUser(data: CreateUserData): Promise<User | null> {
    return db.transaction(async (trx) => {
      await trx.rawQuery('SELECT pg_advisory_xact_lock(?)', [SETUP_LOCK_KEY])
      const existing = await User.query({ client: trx }).select('id').first()
      if (existing) return null
      return User.create(data, { client: trx })
    })
  }
}
