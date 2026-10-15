import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import UserMfaService from '#services/user_mfa_service'
import UserService from '#services/user_service'
import MfaException from '#exceptions/mfa_exception'
import { adminLoginMfaValidator } from '#validators/admin_login_mfa_validator'
import { MFA_PENDING_LOGIN_SESSION_KEY } from '#constants/user_mfa'
import { loginUser } from '#utils/user_session'

type PendingLogin = { userId: string; expiresAt: number }

/**
 * Second step of a staff sign-in for Users with MFA on. The password step
 * left the User id in the session; the browser never sends it.
 */
@inject()
export default class AdminSessionMfaStoreController {
  constructor(
    protected userService: UserService,
    protected userMfaService: UserMfaService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const { request, response, session } = ctx
    const { code } = await request.validateUsing(adminLoginMfaValidator)

    const pending = session.get(MFA_PENDING_LOGIN_SESSION_KEY) as PendingLogin | undefined
    if (!pending || typeof pending.userId !== 'string' || pending.expiresAt < Date.now()) {
      session.forget(MFA_PENDING_LOGIN_SESSION_KEY)
      throw MfaException.loginExpired()
    }

    const user = await this.userService.findByIdOrNull(pending.userId)
    if (!user || !user.isActive || !user.mfaEnabled) {
      session.forget(MFA_PENDING_LOGIN_SESSION_KEY)
      throw MfaException.loginExpired()
    }

    await this.userMfaService.verifyLogin(user, code, request.ip())

    await loginUser(ctx, user)
    await this.auditLogService.recordLogin(user, request.ip())
    return response.ok({ data: { redirectTo: '/admin/dashboard' } })
  }
}
