import limiter from '@adonisjs/limiter/services/main'
import { tooManyAttemptsMessage } from '#utils/too_many_attempts_message'

type LoginGuard = 'web' | 'customer'

export type LoginThrottleResult<T> =
  { blocked: true; message: string } | { blocked: false; value: T }

/**
 * Brute-force guard per account: 5 failed passwords for the same email
 * from the same IP block that pair for 20 minutes. A successful login
 * clears the counter.
 */
export default class LoginThrottleService {
  protected limiter() {
    return limiter.use({ requests: 5, duration: '1 min', blockDuration: '20 mins' })
  }

  /**
   * Runs `authenticate` unless the email + IP pair is blocked. A thrown
   * error (invalid credentials) counts as a failed attempt and is rethrown.
   */
  async attempt<T>(
    guard: LoginGuard,
    email: string,
    ip: string,
    authenticate: () => Promise<T>
  ): Promise<LoginThrottleResult<T>> {
    const key = `login_${guard}_${email}_${ip}`
    const [error, value] = await this.limiter().penalize(key, authenticate)
    if (error) {
      return { blocked: true, message: tooManyAttemptsMessage(error.response.availableIn) }
    }
    return { blocked: false, value }
  }
}
