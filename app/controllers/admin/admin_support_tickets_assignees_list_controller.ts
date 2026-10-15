import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import SupportAssigneeTransformer from '#transformers/support_assignee_transformer'

@inject()
export default class AdminSupportTicketsAssigneesListController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const users = await this.supportTicketService.assignableUsers()
    return ctx.serialize(SupportAssigneeTransformer.transform(users))
  }
}
