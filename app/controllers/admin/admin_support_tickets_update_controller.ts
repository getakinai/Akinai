import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import { SupportTicketThreadTransformer } from '#transformers/support_ticket_transformer'
import { adminSupportTicketUpdateValidator } from '#validators/admin_support_ticket_update_validator'

@inject()
export default class AdminSupportTicketsUpdateController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminSupportTicketUpdateValidator)
    const thread = await this.supportTicketService.update(ctx.params.id, {
      status: payload.status,
      assignedUserId: payload.assignedUserId,
    })

    return ctx.serialize(SupportTicketThreadTransformer.transform(thread))
  }
}
