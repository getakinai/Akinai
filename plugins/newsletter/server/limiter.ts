import limiter from '@adonisjs/limiter/services/main'
import { tooManyAttemptsMessage } from '#utils/too_many_attempts_message'

/**
 * Newsletter signup throttles. Defined when routes register rather than on
 * import, because plugins load before the limiter service boots.
 */
export function newsletterThrottles() {
  return [defineIpThrottle(), defineEmailThrottle()]
}

/** Newsletter signups from the storefront footer and maintenance page, per IP. */
function defineIpThrottle() {
  return limiter.define('newsletter', (ctx) => {
    return limiter
      .allowRequests(5)
      .every('1 minute')
      .blockFor('15 mins')
      .usingKey(`ip_${ctx.request.ip()}`)
      .limitExceeded((error) => {
        error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
      })
  })
}

/**
 * Newsletter signups per email, so one address can't be resubscribed in a
 * loop from many IPs. Requests without an email are left to the validator.
 */
function defineEmailThrottle() {
  return limiter.define('newsletter_email', (ctx) => {
    const email = String(ctx.request.input('email', '')).trim().toLowerCase().slice(0, 254)
    if (!email) return null
    return limiter
      .allowRequests(3)
      .every('1 hour')
      .usingKey(`email_${email}`)
      .limitExceeded((error) => {
        error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
      })
  })
}
