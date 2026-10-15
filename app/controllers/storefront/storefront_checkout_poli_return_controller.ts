import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsTrackingService from '#services/analytics_tracking_service'
import CheckoutService, { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import PoliPaymentService from '#services/poli_payment_service'
import { checkoutPoliReturnValidator } from '#validators/checkout_poli_return_validator'

/**
 * POLi sends the shopper here after paying, failing or cancelling. The
 * transaction is always looked up with POLi (whatever `status` says) so the
 * order is placed without waiting for the nudge, then the thank-you page
 * is shown. An unpaid checkout goes back to the checkout page.
 */
@inject()
export default class StorefrontCheckoutPoliReturnController {
  constructor(
    protected checkoutService: CheckoutService,
    protected poliPaymentService: PoliPaymentService,
    protected analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(ctx: HttpContext) {
    const { token } = await ctx.request.validateUsing(checkoutPoliReturnValidator, {
      data: ctx.request.qs(),
    })
    const customer = await this.checkoutService.customerFor(ctx.auth.use('customer').user)
    const order = await this.checkoutService.findPlacedOrder(
      ctx.params.id,
      ctx.session.get(PLACED_ORDERS_SESSION_KEY, []),
      customer,
      { includePending: true }
    )

    const pending = order !== null && (order.isPendingCheckout || order.paymentStatus === 'pending')
    if (order && pending) {
      try {
        const settled = await this.poliPaymentService.confirm(order, token ?? null)
        if (settled && order.isPendingCheckout) {
          await this.analyticsTrackingService.recordOrderPlaced(ctx, order.id, '/checkout')
        }
      } catch (error) {
        ctx.logger.error({ err: error, orderId: order.id }, 'Could not confirm POLi payment')
      }
    }

    const current = order?.isPendingCheckout
      ? await this.checkoutService.findPlacedOrder(
          order.id,
          ctx.session.get(PLACED_ORDERS_SESSION_KEY, []),
          customer
        )
      : order
    if (order && !current) return ctx.response.redirect().withQs(false).toPath('/checkout')
    return ctx.response.redirect().withQs(false).toPath(`/checkout/thank-you/${ctx.params.id}`)
  }
}
