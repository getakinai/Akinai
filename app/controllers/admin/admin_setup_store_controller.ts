import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import SetupService from '#services/setup_service'
import { adminSetupStoreValidator } from '#validators/admin_setup_store_validator'
import { loginUser } from '#utils/user_session'

@inject()
export default class AdminSetupStoreController {
  constructor(
    protected setupService: SetupService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const { request, response } = ctx

    // Checked before validation so the email `unique` rule can't be used to
    // probe staff emails once setup is closed.
    if (!(await this.setupService.isRequired())) {
      return response.notFound({ error: 'Setup has already been completed' })
    }

    const { setupToken, operatingCountryCode, fullName, email, password } =
      await request.validateUsing(adminSetupStoreValidator)

    if (!this.setupService.verifyToken(setupToken)) {
      this.setupService.recordFailedAttempt(request.ip())
      return response.badRequest({ error: 'Invalid setup token' })
    }

    const result = await this.setupService.createFirstAdmin(
      { fullName, email, password, operatingCountryCode },
      request.ip()
    )
    if (result.status === 'missing_role') {
      return response.unprocessableEntity({
        error: 'The admin role is missing. Run "node ace db:seed" first.',
      })
    }
    if (result.status === 'closed') {
      return response.notFound({ error: 'Setup has already been completed' })
    }

    await loginUser(ctx, result.user)
    await this.auditLogService.recordLogin(result.user, request.ip())
    return response.ok({ data: { redirectTo: '/admin/dashboard' } })
  }
}
