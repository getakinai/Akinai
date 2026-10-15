/** A numeric `$extras` column (Postgres returns some as strings), or null. */
export const extraNumber = (value: unknown) =>
  value === undefined || value === null ? null : Number(value)
