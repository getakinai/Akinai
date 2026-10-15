import { createHash } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

const RANGE_URL = 'https://api.pwnedpasswords.com/range/'
const TIMEOUT_MS = 3000

export function isPwnedCheckEnabled(): boolean {
  return env.get('PWNED_PASSWORDS_ENABLED') ?? false
}

/**
 * How many times the password appears in known breaches, using the
 * HaveIBeenPwned range API (k-anonymity: only the first 5 characters of the
 * SHA-1 hash leave the server, and padding hides the response size).
 * Returns 0 when the service can't be reached, so signups aren't blocked by
 * an outage.
 */
export async function pwnedPasswordCount(
  password: string,
  fetcher: typeof fetch = fetch
): Promise<number> {
  const digest = createHash('sha1').update(password).digest('hex').toUpperCase()
  const prefix = digest.slice(0, 5)
  const suffix = digest.slice(5)

  try {
    const response = await fetcher(`${RANGE_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'storefront-password-check' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) {
      logger.warn({ status: response.status }, 'Pwned Passwords check failed')
      return 0
    }

    const body = await response.text()
    for (const line of body.split('\n')) {
      const [hashSuffix, count] = line.trim().split(':')
      if (hashSuffix === suffix) return Number.parseInt(count, 10) || 0
    }
    return 0
  } catch (error) {
    logger.warn({ err: error }, 'Pwned Passwords check unavailable')
    return 0
  }
}
