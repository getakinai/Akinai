import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { USER_SESSION_VERSION_KEY } from '#constants/user_mfa'

/**
 * Signs out a staff session that was started before the User's password
 * last changed or MFA was turned off (`sessionVersion` bumped). Runs
 * globally after `SilentAuthMiddleware`. Sessions from before this check
 * existed count as version 0.
 */
export default class UserSessionVersionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const guard = ctx.auth.use('web')
    const user = guard.user

    if (user) {
      const stored = Number(ctx.session.get(USER_SESSION_VERSION_KEY, 0))
      if (stored !== user.sessionVersion) {
        await guard.logout()
        ctx.session.forget(USER_SESSION_VERSION_KEY)
      }
    }

    return next()
  }
}
