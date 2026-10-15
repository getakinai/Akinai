import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import ImpersonationService from '#services/impersonation_service'
import { logoutUser } from '#utils/user_session'

@inject()
export default class AdminSessionDeleteController {
  constructor(
    protected auditLogService: AuditLogService,
    protected impersonationService: ImpersonationService
  ) {}

  async handle(ctx: HttpContext) {
    const user = ctx.auth.use('web').user
    await this.impersonationService.stop(ctx)
    await logoutUser(ctx)
    if (user) {
      await this.auditLogService.recordSecurityEvent('logged_out', user, {
        ipAddress: ctx.request.ip(),
      })
    }
    return ctx.response.ok({ data: { redirectTo: '/admin/login' } })
  }
}
