import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderPaymentProofService from '#services/order_payment_proof_service'
import OrderService from '#services/order_service'
import { sendPrivateImage } from '#utils/private_image_response'

@inject()
export default class CustomersAccountOrderPaymentProofImageViewController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected orderPaymentProofService: OrderPaymentProofService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)
    return sendPrivateImage(ctx, await this.orderPaymentProofService.image(order.id))
  }
}
