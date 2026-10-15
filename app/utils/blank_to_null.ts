/** Trimmed text, or null when it is missing or only whitespace. */
export const blankToNull = (value: string | null | undefined) => value?.trim() || null
