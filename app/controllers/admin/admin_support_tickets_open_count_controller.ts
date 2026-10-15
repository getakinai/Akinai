import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'

@inject()
export default class AdminSupportTicketsOpenCountController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const open = await this.supportTicketService.openCount()
    return ctx.response.ok({ data: { open } })
  }
}
