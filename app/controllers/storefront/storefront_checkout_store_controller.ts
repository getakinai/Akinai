import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsTrackingService from '#services/analytics_tracking_service'
import CheckoutService, {
  MAX_REMEMBERED_ORDERS,
  PLACED_ORDERS_SESSION_KEY,
} from '#services/checkout_service'
import PoliPaymentService from '#services/poli_payment_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StripePaymentService from '#services/stripe_payment_service'
import { checkoutStoreValidator } from '#validators/checkout_store_validator'

@inject()
export default class StorefrontCheckoutStoreController {
  constructor(
    protected checkoutService: CheckoutService,
    protected stripePaymentService: StripePaymentService,
    protected poliPaymentService: PoliPaymentService,
    protected storefrontMarketService: StorefrontMarketService,
    protected analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(checkoutStoreValidator)
    const customer = await this.checkoutService.customerFor(ctx.auth.use('customer').user)
    const market = await this.storefrontMarketService.current(ctx)
    const order = await this.checkoutService.place(payload, customer, market, ctx.request.ip())

    const placed: string[] = ctx.session.get(PLACED_ORDERS_SESSION_KEY, [])
    ctx.session.put(
      PLACED_ORDERS_SESSION_KEY,
      [order.id, ...placed.filter((id) => id !== order.id)].slice(0, MAX_REMEMBERED_ORDERS)
    )

    if (!order.isPendingCheckout) {
      await this.analyticsTrackingService.recordOrderPlaced(ctx, order.id, '/checkout')
      const redirectTo = customer
        ? `/account?placed=${order.id}`
        : `/checkout/thank-you/${order.id}`
      return ctx.response.created({ data: { redirectTo } })
    }

    if (order.paymentMethod === 'poli') {
      try {
        const redirectTo = await this.poliPaymentService.start(order)
        return ctx.response.created({ data: { redirectTo } })
      } catch (error) {
        ctx.logger.error({ err: error, orderId: order.id }, 'Could not start POLi payment')
        return ctx.response.badRequest({
          error: 'We couldn’t open POLi. Try again or choose another payment method.',
        })
      }
    }

    try {
      const redirectTo = await this.stripePaymentService.start(order)
      return ctx.response.created({ data: { redirectTo } })
    } catch (error) {
      ctx.logger.error({ err: error, orderId: order.id }, 'Could not start Stripe checkout')
      return ctx.response.badRequest({
        error: 'We couldn’t open the card payment page. Try again or choose bank transfer.',
      })
    }
  }
}
