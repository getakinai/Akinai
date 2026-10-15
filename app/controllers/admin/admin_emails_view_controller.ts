import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailLogService from '#services/email_log_service'
import EmailLogTransformer from '#transformers/email_log_transformer'

@inject()
export default class AdminEmailsViewController {
  constructor(protected emailLogService: EmailLogService) {}

  async handle(ctx: HttpContext) {
    const log = await this.emailLogService.find(ctx.params.id)
    return ctx.serialize(EmailLogTransformer.transform(log).useVariant('toDetail'))
  }
}
