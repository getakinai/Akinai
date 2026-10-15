import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import SupportTicketTransformer from '#transformers/support_ticket_transformer'
import { adminSupportTicketsListQueryValidator } from '#validators/admin_support_tickets_list_query_validator'

@inject()
export default class AdminSupportTicketsListController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminSupportTicketsListQueryValidator, {
      data: ctx.request.qs(),
    })
    const user = ctx.auth.use('web').getUserOrFail()
    const tickets = await this.supportTicketService.paginateForAdmin(user.id, filters)

    return ctx.serialize(SupportTicketTransformer.paginate(tickets.all(), tickets.getMeta()))
  }
}
