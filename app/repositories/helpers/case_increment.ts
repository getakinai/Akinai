import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Adds a per-row amount (negative to subtract) to an integer column in one
 * `UPDATE ... SET column = column + CASE id WHEN ? THEN ? END WHERE id IN
 * (...)`. With `floorAtZero` the result never goes below 0. Query-builder
 * updates skip model hooks, so they are not audited.
 */
export async function caseIncrement(
  trx: TransactionClientContract,
  table: string,
  column: string,
  changes: { id: string; change: number }[],
  { floorAtZero = false } = {}
) {
  const rows = changes.filter(({ change }) => change !== 0)
  if (rows.length === 0) return

  const caseSql = `CASE id ${rows.map(() => 'WHEN ? THEN ?::integer').join(' ')} END`
  const bindings = rows.flatMap(({ id, change }) => [id, change])
  const expression = floorAtZero ? `GREATEST(?? + ${caseSql}, 0)` : `?? + ${caseSql}`

  await trx
    .from(table)
    .whereIn(
      'id',
      rows.map(({ id }) => id)
    )
    .update({
      [column]: trx.raw(expression, [column, ...bindings]),
      updated_at: new Date(),
    })
}
