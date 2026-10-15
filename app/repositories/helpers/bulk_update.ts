import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

/**
 * Which records a bulk status change may touch, by whether they are
 * archived now.
 */
export type BulkStatusSource = 'archived' | 'unarchived' | 'any'

/**
 * Sets `changes` (keyed by model attribute name) on the records in `ids`
 * that match `scope`: one locking read and one `UPDATE ... WHERE id IN
 * (...)`. Returns the changed rows with their previous values, for
 * `AuditLogService.recordBulkUpdate`. Reads whole rows because audit labels
 * come from model-specific attributes; the bulk validators cap `ids`.
 */
export async function bulkUpdate<Model extends LucidModel>(
  Model: Model,
  ids: string[],
  changes: Record<string, unknown>,
  scope: (query: ModelQueryBuilderContract<Model>) => void
): Promise<InstanceType<Model>[]> {
  return db.transaction(async (trx) => {
    const query = Model.query({ client: trx }).whereIn('id', ids)
    scope(query)
    const changed = await query.forUpdate()
    if (changed.length === 0) return []

    const values = Object.fromEntries(
      Object.entries(changes).map(([attribute, value]) => [
        Model.$keys.attributesToColumns.get(attribute, attribute),
        DateTime.isDateTime(value) ? value.toJSDate() : value,
      ])
    )
    await Model.query({ client: trx })
      .whereIn(
        'id',
        changed.map((row) => row.$primaryKeyValue as string)
      )
      .update({ ...values, updated_at: new Date() })
    return changed
  })
}
