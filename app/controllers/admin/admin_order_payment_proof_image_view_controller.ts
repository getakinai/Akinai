import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPaymentProofService from '#services/order_payment_proof_service'
import OrderService from '#services/order_service'
import { sendPrivateImage } from '#utils/private_image_response'

@inject()
export default class AdminOrderPaymentProofImageViewController {
  constructor(
    protected orderService: OrderService,
    protected orderPaymentProofService: OrderPaymentProofService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    return sendPrivateImage(ctx, await this.orderPaymentProofService.image(order.id))
  }
}
