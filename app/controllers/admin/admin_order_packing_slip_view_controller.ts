import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderDocumentService from '#services/order_document_service'
import OrderService from '#services/order_service'
import { sendPdf } from '#utils/pdf_response'

@inject()
export default class AdminOrderPackingSlipViewController {
  constructor(
    protected orderService: OrderService,
    protected orderDocumentService: OrderDocumentService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findDetailOrFail(ctx.params.id)
    return sendPdf(ctx, await this.orderDocumentService.render('packing_slip', order))
  }
}
