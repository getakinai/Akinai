import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderDocumentService from '#services/order_document_service'
import OrderService from '#services/order_service'
import { sendPdf } from '#utils/pdf_response'

@inject()
export default class CustomersAccountOrderReceiptViewController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected orderDocumentService: OrderDocumentService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)
    return sendPdf(ctx, await this.orderDocumentService.render('receipt', order))
  }
}
