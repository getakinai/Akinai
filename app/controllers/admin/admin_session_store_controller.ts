import { inject } from '@adonisjs/core'
import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import LoginThrottleService from '#services/login_throttle_service'
import UserService from '#services/user_service'
import { adminLoginValidator } from '#validators/admin_login_validator'
import { MFA_PENDING_LOGIN_SESSION_KEY, MFA_PENDING_LOGIN_TTL_SECONDS } from '#constants/user_mfa'
import { loginUser } from '#utils/user_session'

@inject()
export default class AdminSessionStoreController {
  constructor(
    protected userService: UserService,
    protected auditLogService: AuditLogService,
    protected loginThrottleService: LoginThrottleService
  ) {}

  async handle(ctx: HttpContext) {
    const { request, response, session } = ctx
    const { email, password } = await request.validateUsing(adminLoginValidator)

    try {
      const attempt = await this.loginThrottleService.attempt('web', email, request.ip(), () =>
        this.userService.authenticate(email, password)
      )
      if (attempt.blocked) {
        await this.userService.recordLoginFailure('login_blocked', email, request.ip())
        return response.tooManyRequests({ error: attempt.message })
      }

      const user = attempt.value
      if (!user.isActive) {
        return response.badRequest({
          error:
            user.status === 'pending'
              ? 'Your account is pending activation'
              : 'Your account has been deactivated',
        })
      }

      if (user.mfaEnabled) {
        session.regenerate()
        session.put(MFA_PENDING_LOGIN_SESSION_KEY, {
          userId: user.id,
          expiresAt: Date.now() + MFA_PENDING_LOGIN_TTL_SECONDS * 1000,
        })
        return response.ok({ data: { mfaRequired: true } })
      }

      await loginUser(ctx, user)
      await this.auditLogService.recordLogin(user, request.ip())
      return response.ok({ data: { redirectTo: '/admin/dashboard' } })
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        await this.userService.recordLoginFailure('login_failed', email, request.ip())
        return response.badRequest({ error: 'Invalid email or password' })
      }
      throw error
    }
  }
}
