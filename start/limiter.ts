/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Counters live in the store
| set by `LIMITER_STORE` (Redis in development/production).
|
*/

import limiter from '@adonisjs/limiter/services/main'
import { CATALOG_NONCE_SESSION_KEY } from '#constants/storefront'
import { tooManyAttemptsMessage } from '#utils/too_many_attempts_message'

/**
 * Admin and customer login, per IP. Failed passwords are also limited
 * per email + IP by `LoginThrottleService`.
 */
export const loginThrottle = limiter.define('login', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Customer Google/Microsoft sign-in (redirect and callback), per IP.
 */
export const socialAuthThrottle = limiter.define('social_auth', (ctx) => {
  return limiter
    .allowRequests(20)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Starting a customer signup, per IP. Each attempt sends an email.
 */
export const setupThrottle = limiter.define('setup', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

export const signupThrottle = limiter.define('signup', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Entering or resending a one-time code (signup and password reset), per
 * IP. Each code also locks itself after a few wrong guesses.
 */
export const otpThrottle = limiter.define('otp', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Asking for a password reset code, per IP.
 */
export const forgotPasswordThrottle = limiter.define('forgot_password', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Asking for a password reset code, per email, so one inbox can't be
 * flooded from many IPs. Requests without an email are left to the
 * validator.
 */
export const forgotPasswordEmailThrottle = limiter.define('forgot_password_email', (ctx) => {
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

/**
 * Changing a signed-in account's password (staff or customer details), per
 * IP. Each attempt checks the current password, so a hijacked session
 * can't guess it. Requests without `currentPassword` (plain profile edits)
 * are not counted.
 */
export const accountPasswordThrottle = limiter.define('account_password', (ctx) => {
  if (!ctx.request.input('currentPassword')) return limiter.noLimit()
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Pricing the cart or quoting checkout totals and shipping, per IP. Runs
 * on every cart and address change, so the limit is generous.
 */
export const pricingThrottle = limiter.define('pricing', (ctx) => {
  return limiter
    .allowRequests(60)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Switching the storefront market (country and currency), per IP. Each
 * switch writes the session and re-prices the shopper's view.
 */
export const marketThrottle = limiter.define('market', (ctx) => {
  return limiter
    .allowRequests(20)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Starting a Stripe payment for an order, per IP. Each request creates a
 * Stripe Checkout session.
 */
export const paymentThrottle = limiter.define('payment', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('5 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Address autocomplete and details, per IP. Each request is a paid Google
 * Places API call.
 */
export const placesThrottle = limiter.define('places', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Storefront product search, per IP.
 */
export const searchThrottle = limiter.define('search', (ctx) => {
  return limiter
    .allowRequests(60)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Storefront collection product lists and their filters, per IP. Filtered
 * lists run heavier queries, and shoppers page and re-filter often.
 */
export const catalogThrottle = limiter.define('catalog', (ctx) => {
  return limiter
    .allowRequests(120)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Issuing storefront catalog tokens, per IP. Each new session needs one,
 * so this caps how fast a scraper can start fresh sessions to get around
 * `catalogSessionThrottle`.
 */
export const catalogTokenThrottle = limiter.define('catalog_token', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Storefront catalog JSON requests per session (keyed by the catalog
 * nonce), on top of the per-IP limits, so a scraper rotating IPs on one
 * session is still slowed down. Runs after `catalogToken`, which rejects
 * requests from sessions without a nonce.
 */
export const catalogSessionThrottle = limiter.define('catalog_session', (ctx) => {
  const nonce = ctx.session.get(CATALOG_NONCE_SESSION_KEY)
  return limiter
    .allowRequests(300)
    .every('10 minutes')
    .usingKey(typeof nonce === 'string' && nonce ? `session_${nonce}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Storefront analytics events (page views, product views, add to cart),
 * per IP. Each page load sends one or two; the limit allows fast browsing
 * while stopping floods that would fill the events table.
 */
export const analyticsEventThrottle = limiter.define('analytics_event', (ctx) => {
  return limiter
    .allowRequests(120)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Stripe webhooks, per IP. High enough for Stripe's retries and bursts;
 * stops floods of unsigned requests.
 */
export const webhookThrottle = limiter.define('webhook', (ctx) => {
  return limiter.allowRequests(120).every('1 minute').usingKey(`ip_${ctx.request.ip()}`)
})

/**
 * Placing an order, per IP.
 */
export const checkoutThrottle = limiter.define('checkout', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('5 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Resending a logged email from the back office, per staff user.
 */
export const emailResendThrottle = limiter.define('email_resend', (ctx) => {
  const userId = ctx.auth.use('web').user?.id
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .usingKey(userId ? `user_${userId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Starting a storefront session as a customer from the back office, per
 * staff user.
 */
export const impersonationThrottle = limiter.define('impersonation', (ctx) => {
  const userId = ctx.auth.use('web').user?.id
  return limiter
    .allowRequests(10)
    .every('10 minutes')
    .usingKey(userId ? `user_${userId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

function csvTransferThrottle(name: string, requests: number) {
  return limiter.define(name, (ctx) => {
    const userId = ctx.auth.use('web').user?.id
    return limiter
      .allowRequests(requests)
      .every('10 minutes')
      .usingKey(userId ? `user_${userId}` : `ip_${ctx.request.ip()}`)
      .limitExceeded((error) => {
        error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
      })
  })
}

/**
 * CSV export and import of one back-office resource, per staff user. Each
 * import parses and writes up to a thousand rows. Call once per resource;
 * every resource has its own budget.
 */
export function csvThrottles(resource: string) {
  return {
    export: csvTransferThrottle(`${resource}_export`, 10),
    import: csvTransferThrottle(`${resource}_import`, 5),
  }
}

/**
 * Analytics report downloads (CSV or PDF), per staff user. Each one runs
 * the report's queries and, for PDF, renders the document.
 */
export const analyticsExportThrottle = csvTransferThrottle('analytics_report_export', 30)

/**
 * Customers sending proof of a bank transfer payment, per customer account.
 */
export const paymentProofThrottle = limiter.define('payment_proof', (ctx) => {
  const accountId = ctx.auth.use('customer').user?.id
  return limiter
    .allowRequests(10)
    .every('1 hour')
    .usingKey(accountId ? `customer_${accountId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Customers replying to notes on their orders, per customer account.
 */
export const orderNoteReplyThrottle = limiter.define('order_note_reply', (ctx) => {
  const accountId = ctx.auth.use('customer').user?.id
  return limiter
    .allowRequests(20)
    .every('1 hour')
    .usingKey(accountId ? `customer_${accountId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Support requests sent from the help chat, per IP. Each one emails the
 * team and the sender.
 */
export const supportTicketStoreThrottle = limiter.define('support_ticket_store', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('10 minutes')
    .blockFor('30 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Support requests per email address, so one inbox can't be flooded with
 * confirmation emails from many IPs.
 */
export const supportTicketEmailThrottle = limiter.define('support_ticket_email', (ctx) => {
  const email = String(ctx.request.input('email', '')).trim().toLowerCase().slice(0, 254)
  if (!email) return null
  return limiter
    .allowRequests(5)
    .every('1 day')
    .usingKey(`email_${email}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Customer replies on a support thread, per customer account or IP.
 */
export const supportTicketReplyThrottle = limiter.define('support_ticket_reply', (ctx) => {
  const accountId = ctx.auth.use('customer').user?.id
  return limiter
    .allowRequests(20)
    .every('1 hour')
    .usingKey(accountId ? `customer_${accountId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Opening support threads from an emailed link, per IP, so links can't be
 * guessed in bulk.
 */
export const supportThreadViewThrottle = limiter.define('support_thread_view', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('1 minute')
    .blockFor('15 mins')
    .usingKey(`ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Order PDF downloads (invoice, receipt, packing slip), which are rendered
 * on each request. Per staff user, customer account, or IP for guests.
 */
export const orderDocumentThrottle = limiter.define('order_document', (ctx) => {
  const userId = ctx.auth.use('web').user?.id
  const accountId = ctx.auth.use('customer').user?.id
  const key = userId
    ? `user_${userId}`
    : accountId
      ? `customer_${accountId}`
      : `ip_${ctx.request.ip()}`
  return limiter
    .allowRequests(60)
    .every('10 minutes')
    .usingKey(key)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Saving or removing wishlist products, per customer account. Generous
 * because shoppers tap hearts quickly while browsing.
 */
export const wishlistThrottle = limiter.define('wishlist', (ctx) => {
  const accountId = ctx.auth.use('customer').user?.id
  return limiter
    .allowRequests(60)
    .every('1 minute')
    .usingKey(accountId ? `customer_${accountId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Customers writing product reviews, per customer account. Each product
 * takes one review per customer; this stops spam across many products.
 */
export const productReviewThrottle = limiter.define('product_review', (ctx) => {
  const accountId = ctx.auth.use('customer').user?.id
  return limiter
    .allowRequests(10)
    .every('1 hour')
    .usingKey(accountId ? `customer_${accountId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})

/**
 * Customers requesting a return from their account, per customer account.
 */
export const returnRequestThrottle = limiter.define('return_request', (ctx) => {
  const accountId = ctx.auth.use('customer').user?.id
  return limiter
    .allowRequests(5)
    .every('1 hour')
    .usingKey(accountId ? `customer_${accountId}` : `ip_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage(tooManyAttemptsMessage(error.response.availableIn))
    })
})
