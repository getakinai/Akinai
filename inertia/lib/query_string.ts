type QueryValue = string | number | boolean | null | undefined | readonly string[]

/**
 * Builds `?a=1&b=2` from an object, skipping empty values. Arrays are sent
 * as repeated `key[]` entries so the server always parses them as arrays.
 * Returns an empty string when nothing is left.
 */
export function toQueryString(query: Record<string, QueryValue>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(`${key}[]`, item)
      continue
    }
    params.set(key, String(value))
  }
  const result = params.toString()
  return result ? `?${result}` : ''
}
