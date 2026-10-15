import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { auditActor } from '#services/audit_actor'

/**
 * Runs the rest of the request with the signed-in staff User as the audit
 * actor. Use after `auth({ guards: ['web'] })`.
 */
export default class AuditActorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.use('web').user
    if (!user) {
      return next()
    }
    return auditActor.run({ userId: user.id, ipAddress: ctx.request.ip() }, () => next())
  }
}
