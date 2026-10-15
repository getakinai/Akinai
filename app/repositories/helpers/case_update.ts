import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type CaseUpdateRow = {
  id: string
  /** Column name to new value; columns left out keep their value. */
  values: Record<string, string | number | boolean | null>
}

/**
 * Sets a different value on each row in one `UPDATE ... SET column = CASE
 * id WHEN ? THEN ?::type ... ELSE column END WHERE id IN (...)`. `types`
 * maps every column that may be set to its SQL type for the cast.
 * Query-builder updates skip model hooks, so they are not audited.
 */
export async function caseUpdate(
  trx: TransactionClientContract,
  table: string,
  types: Record<string, string>,
  rows: CaseUpdateRow[]
) {
  const changed = rows.filter(({ values }) => Object.keys(values).length > 0)
  if (changed.length === 0) return

  const set: Record<string, unknown> = { updated_at: new Date() }
  for (const [column, type] of Object.entries(types)) {
    const setting = changed.filter(({ values }) => column in values)
    if (setting.length === 0) continue

    const whens = setting
      .map(({ values }) =>
        values[column] === null ? 'WHEN ? THEN NULL' : `WHEN ? THEN ?::${type}`
      )
      .join(' ')
    const bindings = setting.flatMap(({ id, values }) =>
      values[column] === null ? [id] : [id, values[column]]
    )
    set[column] = trx.raw(`CASE id ${whens} ELSE ?? END`, [...bindings, column])
  }

  await trx
    .from(table)
    .whereIn(
      'id',
      changed.map(({ id }) => id)
    )
    .update(set)
}
