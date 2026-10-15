/** Escapes `%`, `_` and `\` so user text matches literally in LIKE / ILIKE. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

/**
 * ILIKE pattern matching `value` anywhere in the column. Accepts the
 * optional search term from `.if(q, ...)` callbacks, where it is set.
 */
export const containsPattern = (value: string | null | undefined) => `%${escapeLike(value ?? '')}%`
