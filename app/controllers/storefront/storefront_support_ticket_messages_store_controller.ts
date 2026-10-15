import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import SupportTicketService from '#services/support_ticket_service'
import { storefrontSupportTicketTokenValidator } from '#validators/storefront_support_ticket_token_validator'
import { supportTicketReplyStoreValidator } from '#validators/support_ticket_reply_store_validator'

@inject()
export default class StorefrontSupportTicketMessagesStoreController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await storefrontSupportTicketTokenValidator.tryValidate({
      token: ctx.params.token,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()
    const { body } = await ctx.request.validateUsing(supportTicketReplyStoreValidator)

    const ticket = await this.supportTicketService.findByTokenOrFail(params.token, ctx.request.ip())
    await this.supportTicketService.replyByCustomer(ticket, body)

    return ctx.response.created({ data: { sent: true } })
  }
}
