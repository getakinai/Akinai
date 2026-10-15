import limiter from '@adonisjs/limiter/services/main'
import { errors } from '@vinejs/vine'
import { tooManyAttemptsMessage } from '#utils/too_many_attempts_message'

const BLOCK_DURATION = '15 mins'

function isDiscountCodeError(error: unknown): boolean {
  return (
    error instanceof errors.E_VALIDATION_ERROR &&
    Array.isArray(error.messages) &&
    error.messages.some((message: { field?: string }) => message.field === 'discountCode')
  )
}

/**
 * Stops shoppers guessing discount codes: 10 rejected codes from the same
 * IP within 15 minutes block code checks from that IP for 15 minutes.
 * Unlike `penalize`, an accepted code does not reset the count, so a
 * known code can't be used to keep guessing.
 */
export default class DiscountCodeThrottleService {
  protected limiter() {
    return limiter.use({ requests: 10, duration: '15 mins', blockDuration: BLOCK_DURATION })
  }

  /**
   * Runs `check` unless the IP is blocked. A discount code error thrown by
   * `check` counts as a failed attempt and is rethrown.
   */
  async guard<T>(ip: string | null, check: () => Promise<T>): Promise<T> {
    const codeLimiter = this.limiter()
    const key = `discount_code_${ip ?? 'unknown'}`

    const current = await codeLimiter.get(key)
    if (current && current.remaining <= 0) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'discountCode',
          message: tooManyAttemptsMessage(current.availableIn),
          rule: 'throttle',
        },
      ])
    }

    try {
      return await check()
    } catch (error) {
      if (isDiscountCodeError(error)) {
        const { consumed, limit } = await codeLimiter.increment(key)
        if (consumed >= limit) await codeLimiter.block(key, BLOCK_DURATION)
      }
      throw error
    }
  }
}
