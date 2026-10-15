import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderService from '#services/order_service'
import PaymentMethodService from '#services/payment_method_service'
import CheckoutOrderTransformer from '#transformers/checkout_order_transformer'

@inject()
export default class CustomersAccountOrdersViewController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected paymentMethodService: PaymentMethodService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)
    await this.paymentMethodService.withBankTransfer(order)
    return ctx.serialize(CheckoutOrderTransformer.transform(order))
  }
}
