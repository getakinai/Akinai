import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderService from '#services/order_service'
import OrderNoteService from '#services/order_note_service'
import OrderNoteTransformer from '#transformers/order_note_transformer'

@inject()
export default class CustomersAccountOrderNotesListController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected orderNoteService: OrderNoteService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)
    const notes = await this.orderNoteService.listForCustomer(order.id)
    return ctx.serialize(OrderNoteTransformer.transform(notes).useVariant('toCustomer'))
  }
}
