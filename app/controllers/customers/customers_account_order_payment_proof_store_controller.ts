import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderPaymentProofService from '#services/order_payment_proof_service'
import OrderService from '#services/order_service'
import PaymentMethodService from '#services/payment_method_service'
import CheckoutOrderTransformer from '#transformers/checkout_order_transformer'
import { customersOrderPaymentProofStoreValidator } from '#validators/customers_order_payment_proof_store_validator'

@inject()
export default class CustomersAccountOrderPaymentProofStoreController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected orderPaymentProofService: OrderPaymentProofService,
    protected paymentMethodService: PaymentMethodService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(customersOrderPaymentProofStoreValidator)
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)

    await this.orderPaymentProofService.submit(order, {
      image: payload.image ?? null,
      details: payload.details || null,
    })

    const updated = await this.orderService.findForCustomerOrFail(customer.id, order.id)
    await this.paymentMethodService.withBankTransfer(updated)
    return ctx.serialize(CheckoutOrderTransformer.transform(updated))
  }
}
