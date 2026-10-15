import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailLogService from '#services/email_log_service'
import { adminEmailResendValidator } from '#validators/admin_email_resend_validator'

@inject()
export default class AdminEmailsResendStoreController {
  constructor(protected emailLogService: EmailLogService) {}

  async handle(ctx: HttpContext) {
    await ctx.request.validateUsing(adminEmailResendValidator)
    const user = ctx.auth.use('web').getUserOrFail()
    await this.emailLogService.resend(ctx.params.id, user.id)

    return { data: { queued: true } }
  }
}
