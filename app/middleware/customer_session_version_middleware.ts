import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import {
  CUSTOMER_SESSION_VERSION_KEY,
  IMPERSONATION_SESSION_KEY,
  activeImpersonation,
  readImpersonation,
} from '#utils/customer_session'

/**
 * Signs out a customer session that was started before the account's
 * password last changed (`sessionVersion` bumped). Runs globally after
 * `SilentAuthMiddleware`, so stale sessions are dropped on every route,
 * including checkout. Sessions from before this check existed count as
 * version 0.
 *
 * Also ends an impersonation once the staff User who started it is no
 * longer signed in (or a different account is), so a customer session
 * opened by staff never outlives their back-office session.
 */
export default class CustomerSessionVersionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const guard = ctx.auth.use('customer')
    const account = guard.user

    if (readImpersonation(ctx) && !activeImpersonation(ctx)) {
      if (account) await guard.logout()
      ctx.session.forget(CUSTOMER_SESSION_VERSION_KEY)
      ctx.session.forget(IMPERSONATION_SESSION_KEY)
      return next()
    }

    if (account) {
      const stored = Number(ctx.session.get(CUSTOMER_SESSION_VERSION_KEY, 0))
      if (stored !== account.sessionVersion) {
        await guard.logout()
        ctx.session.forget(CUSTOMER_SESSION_VERSION_KEY)
        ctx.session.forget(IMPERSONATION_SESSION_KEY)
      }
    }

    return next()
  }
}
