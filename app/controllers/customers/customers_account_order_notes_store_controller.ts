import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderNoteService from '#services/order_note_service'
import OrderService from '#services/order_service'
import OrderNoteTransformer from '#transformers/order_note_transformer'
import { customersOrderNoteReplyStoreValidator } from '#validators/customers_order_note_reply_store_validator'

@inject()
export default class CustomersAccountOrderNotesStoreController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected orderNoteService: OrderNoteService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(customersOrderNoteReplyStoreValidator)
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)

    const reply = await this.orderNoteService.replyByCustomer(
      order,
      customer.id,
      payload.parentId,
      payload.body
    )
    return ctx.serialize(OrderNoteTransformer.transform(reply).useVariant('toCustomer'))
  }
}
