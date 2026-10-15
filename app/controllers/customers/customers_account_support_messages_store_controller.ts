import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import { supportTicketReplyStoreValidator } from '#validators/support_ticket_reply_store_validator'

@inject()
export default class CustomersAccountSupportMessagesStoreController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const { body } = await ctx.request.validateUsing(supportTicketReplyStoreValidator)
    const account = ctx.auth.use('customer').getUserOrFail()
    const ticket = await this.supportTicketService.findForCustomerOrFail(
      account.customerId,
      ctx.params.id
    )
    await this.supportTicketService.replyByCustomer(ticket, body)

    return ctx.response.created({ data: { sent: true } })
  }
}
