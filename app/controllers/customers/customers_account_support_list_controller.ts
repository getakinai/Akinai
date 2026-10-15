import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportTicketService from '#services/support_ticket_service'
import SupportTicketTransformer from '#transformers/support_ticket_transformer'
import { customersAccountSupportListQueryValidator } from '#validators/customers_account_support_list_query_validator'

@inject()
export default class CustomersAccountSupportListController {
  constructor(protected supportTicketService: SupportTicketService) {}

  async handle(ctx: HttpContext) {
    const { page, perPage } = await ctx.request.validateUsing(
      customersAccountSupportListQueryValidator,
      { data: ctx.request.qs() }
    )
    const account = ctx.auth.use('customer').getUserOrFail()
    const tickets = await this.supportTicketService.paginateForCustomer(
      account.customerId,
      page,
      perPage
    )

    return ctx.serialize(
      SupportTicketTransformer.paginate(tickets.all(), tickets.getMeta()).useVariant('toCustomer')
    )
  }
}
