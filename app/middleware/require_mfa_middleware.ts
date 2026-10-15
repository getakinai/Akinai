import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * When `REQUIRE_STAFF_MFA` is on, staff without two-step verification can
 * only reach their account security page until they turn it on. Runs after
 * `auth({ guards: ['web'] })`.
 */
export default class RequireMfaMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!env.get('REQUIRE_STAFF_MFA', false)) return next()

    const user = ctx.auth.use('web').getUserOrFail()
    if (user.mfaEnabled) return next()

    const message = 'Turn on 2FA to continue'
    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.forbidden({ errors: [{ message, code: 'E_MFA_REQUIRED' }] })
    }
    return ctx.response.redirect().toRoute('admin.account.home')
  }
}
