import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import SupportTicketService from '#services/support_ticket_service'
import { SupportTicketThreadTransformer } from '#transformers/support_ticket_transformer'
import { storefrontSupportTicketTokenValidator } from '#validators/storefront_support_ticket_token_validator'

@inject()
export default class StorefrontSupportTicketsViewController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontSupportTicketTokenValidator.tryValidate({
      token: ctx.params.token,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const ticket = await this.supportTicketService.findByTokenOrFail(
      payload.token,
      ctx.request.ip()
    )
    const messages = await this.supportTicketService.customerMessages(ticket)

    ctx.response.header('Referrer-Policy', 'no-referrer')
    ctx.response.header('Cache-Control', 'no-store')
    return ctx.serialize(
      SupportTicketThreadTransformer.transform({ ticket, messages }).useVariant('toPublic')
    )
  }
}
