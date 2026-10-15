import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailLogService from '#services/email_log_service'
import EmailLogTransformer from '#transformers/email_log_transformer'
import { adminEmailsListQueryValidator } from '#validators/admin_emails_list_query_validator'

@inject()
export default class AdminEmailsListController {
  constructor(protected emailLogService: EmailLogService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminEmailsListQueryValidator, {
      data: ctx.request.qs(),
    })
    const logs = await this.emailLogService.paginate(filters)

    return ctx.serialize(EmailLogTransformer.paginate(logs.all(), logs.getMeta()))
  }
}
