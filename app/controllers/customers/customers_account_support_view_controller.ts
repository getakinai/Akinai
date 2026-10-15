import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import { SupportTicketThreadTransformer } from '#transformers/support_ticket_transformer'

@inject()
export default class CustomersAccountSupportViewController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const account = ctx.auth.use('customer').getUserOrFail()
    const ticket = await this.supportTicketService.findForCustomerOrFail(
      account.customerId,
      ctx.params.id
    )
    const messages = await this.supportTicketService.customerMessages(ticket)

    return ctx.serialize(
      SupportTicketThreadTransformer.transform({ ticket, messages }).useVariant('toCustomer')
    )
  }
}
