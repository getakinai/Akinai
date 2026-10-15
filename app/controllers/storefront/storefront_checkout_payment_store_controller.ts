import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { isOnlinePaymentMethod } from '#constants/payment_methods'
import CheckoutService, { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import PoliPaymentService from '#services/poli_payment_service'
import StripePaymentService from '#services/stripe_payment_service'

/**
 * Opens a new Stripe Checkout or POLi page for an unpaid online order,
 * e.g. after the shopper cancelled or the first attempt failed.
 */
@inject()
export default class StorefrontCheckoutPaymentStoreController {
  constructor(
    protected checkoutService: CheckoutService,
    protected stripePaymentService: StripePaymentService,
    protected poliPaymentService: PoliPaymentService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.checkoutService.customerFor(ctx.auth.use('customer').user)
    const order = await this.checkoutService.findPlacedOrder(
      ctx.params.id,
      ctx.session.get(PLACED_ORDERS_SESSION_KEY, []),
      customer
    )
    if (!order) {
      return ctx.response.notFound({ errors: [{ message: 'We couldn’t find this order' }] })
    }
    if (!isOnlinePaymentMethod(order.paymentMethod) || order.paymentStatus !== 'pending') {
      return ctx.response.unprocessableEntity({
        errors: [{ message: 'This order doesn’t need an online payment' }],
      })
    }

    const redirectTo =
      order.paymentMethod === 'poli'
        ? await this.poliPaymentService.start(order)
        : await this.stripePaymentService.start(order, {
            ownerSignedIn: !!customer && order.customerId === customer.id,
          })
    return ctx.response.created({ data: { redirectTo } })
  }
}
