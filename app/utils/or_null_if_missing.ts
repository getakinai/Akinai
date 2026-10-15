import { errors as lucidErrors } from '@adonisjs/lucid'

/**
 * Resolves to null when a `findOrFail`-style lookup finds no row. Any other
 * failure (connection lost, bad query) is rethrown instead of being
 * mistaken for "not found".
 */
export async function orNullIfMissing<T>(lookup: Promise<T>): Promise<T | null> {
  try {
    return await lookup
  } catch (error) {
    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) return null
    throw error
  }
}
