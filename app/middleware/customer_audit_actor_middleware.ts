import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { auditActor } from '#services/audit_actor'
import { activeImpersonation } from '#utils/customer_session'

/**
 * Runs the rest of the request with the signed-in Customer as the audit
 * actor, so changes they make to their own records are logged. Use after
 * `auth({ guards: ['customer'] })`. While a staff User is impersonating
 * the customer, their id is recorded too.
 */
export default class CustomerAuditActorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const account = ctx.auth.use('customer').user
    if (!account) {
      return next()
    }
    const impersonation = activeImpersonation(ctx)
    return auditActor.run(
      {
        userId: impersonation?.userId ?? null,
        customerId: account.customerId,
        ipAddress: ctx.request.ip(),
      },
      () => next()
    )
  }
}
