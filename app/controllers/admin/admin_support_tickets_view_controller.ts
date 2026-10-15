import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import { SupportTicketThreadTransformer } from '#transformers/support_ticket_transformer'

@inject()
export default class AdminSupportTicketsViewController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const thread = await this.supportTicketService.findForAdmin(ctx.params.id)
    return ctx.serialize(SupportTicketThreadTransformer.transform(thread))
  }
}
