/**
 * `whereRaw` arguments matching `lower(column)` against any of `values`
 * (lowercased) with one binding per value. `column` must be a fixed
 * column name from code, never user input.
 */
export function lowerIn(column: string, values: string[]): [string, string[]] {
  const lowered = [...new Set(values.map((value) => value.toLowerCase()))]
  return [`lower(${column}) in (${lowered.map(() => '?').join(', ')})`, lowered]
}
