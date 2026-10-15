import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import SupportTicketService from '#services/support_ticket_service'
import { storefrontSupportTicketStoreValidator } from '#validators/storefront_support_ticket_store_validator'

@inject()
export default class StorefrontSupportTicketsStoreController {
  constructor(
    protected supportTicketService: SupportTicketService,
    protected customerService: CustomerService
  ) {}

  /**
   * Guests only get the thread link by email, so a request can't be read
   * by someone who typed another person's address. Signed-in customers can
   * also open it from their account.
   */
  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(storefrontSupportTicketStoreValidator)
    const account = ctx.auth.use('customer').user
    const customer = account ? await this.customerService.profileFor(account) : null

    const ticket = await this.supportTicketService.open(payload, customer)

    return ctx.response.created({
      data: {
        reference: ticket.reference,
        email: ticket.email,
        accountTicketId: customer ? ticket.id : null,
      },
    })
  }
}
