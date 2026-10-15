import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CheckoutService, { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import OrderDocumentService from '#services/order_document_service'
import { sendPdf } from '#utils/pdf_response'

@inject()
export default class StorefrontCheckoutOrderReceiptViewController {
  constructor(
    protected checkoutService: CheckoutService,
    protected orderDocumentService: OrderDocumentService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.checkoutService.customerFor(ctx.auth.use('customer').user)
    const order = await this.checkoutService.findPlacedOrder(
      ctx.params.id,
      ctx.session.get(PLACED_ORDERS_SESSION_KEY, []),
      customer
    )
    return sendPdf(ctx, order ? await this.orderDocumentService.render('receipt', order) : null)
  }
}
