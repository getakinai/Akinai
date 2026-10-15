import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CheckoutService, { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import PaymentMethodService from '#services/payment_method_service'
import CheckoutOrderTransformer from '#transformers/checkout_order_transformer'

@inject()
export default class StorefrontCheckoutOrderViewController {
  constructor(
    protected checkoutService: CheckoutService,
    protected paymentMethodService: PaymentMethodService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.checkoutService.customerFor(ctx.auth.use('customer').user)
    const result = await this.checkoutService.findThankYouOrder(
      ctx.params.id,
      ctx.session.get(PLACED_ORDERS_SESSION_KEY, []),
      customer
    )
    if (!result) {
      return ctx.response.notFound({ errors: [{ message: 'We couldn’t find this order' }] })
    }
    if (result.expired) {
      return ctx.response.gone({ errors: [{ message: 'This confirmation link has expired' }] })
    }
    const order = await this.paymentMethodService.withBankTransfer(result.order)
    return ctx.serialize(CheckoutOrderTransformer.transform(order))
  }
}
