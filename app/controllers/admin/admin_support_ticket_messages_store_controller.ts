import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import { SupportTicketThreadTransformer } from '#transformers/support_ticket_transformer'
import { adminSupportTicketMessageStoreValidator } from '#validators/admin_support_ticket_message_store_validator'

@inject()
export default class AdminSupportTicketMessagesStoreController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const { body, isInternal } = await ctx.request.validateUsing(
      adminSupportTicketMessageStoreValidator
    )
    const user = ctx.auth.use('web').getUserOrFail()
    const thread = await this.supportTicketService.replyByStaff(
      ctx.params.id,
      user.id,
      body,
      isInternal
    )

    return ctx.serialize(SupportTicketThreadTransformer.transform(thread))
  }
}
