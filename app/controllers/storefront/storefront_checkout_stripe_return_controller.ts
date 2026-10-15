import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsTrackingService from '#services/analytics_tracking_service'
import CheckoutService, { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import StripePaymentService from '#services/stripe_payment_service'
import { checkoutStripeReturnValidator } from '#validators/checkout_stripe_return_validator'

/**
 * Stripe sends the shopper here after paying. Confirms the session with
 * Stripe so the order is placed (or shows as paid) without waiting for the
 * webhook, then shows the thank-you page (guests and signed-in customers
 * alike). An unpaid checkout goes back to the checkout page.
 */
@inject()
export default class StorefrontCheckoutStripeReturnController {
  constructor(
    protected checkoutService: CheckoutService,
    protected stripePaymentService: StripePaymentService,
    protected analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(ctx: HttpContext) {
    const { session_id: sessionId } = await ctx.request.validateUsing(
      checkoutStripeReturnValidator,
      { data: ctx.request.qs() }
    )
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
        const settled = await this.stripePaymentService.confirm(order, sessionId)
        if (settled && order.isPendingCheckout) {
          await this.analyticsTrackingService.recordOrderPlaced(ctx, order.id, '/checkout')
        }
      } catch (error) {
        ctx.logger.error({ err: error, orderId: order.id }, 'Could not confirm Stripe payment')
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
