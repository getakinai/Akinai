import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import BulkResultTransformer from '#transformers/bulk_result_transformer'
import { adminSupportTicketsBulkStatusValidator } from '#validators/admin_support_tickets_bulk_status_validator'

@inject()
export default class AdminSupportTicketsBulkStatusController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const { ids, status } = await ctx.request.validateUsing(adminSupportTicketsBulkStatusValidator)
    const result = await this.supportTicketService.bulkSetStatus(ids, status)
    return ctx.serialize(BulkResultTransformer.transform(result))
  }
}
