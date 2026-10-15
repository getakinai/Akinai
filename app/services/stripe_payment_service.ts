import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { appUrl } from '#config/app'
import { moneyFormatFor, orderTotals } from '#mails/helpers/order_email_data'
import type Order from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import type StoreSetting from '#models/store_setting'
import OrderRepository from '#repositories/order_repository'
import { orderLineSummary } from '#services/order_audit'
import OrderPaymentSettlementService from '#services/order_payment_settlement_service'
import RefundService from '#services/refund_service'
import StoreSettingService from '#services/store_setting_service'
import StripeGatewayService, {
  chargeMatchesOrder,
  type StripeCheckoutDetails,
  type StripeSessionResult,
} from '#services/stripe_gateway_service'

/** Items listed on the Stripe page before the rest are summed up as "and N more". */
const MAX_LISTED_ITEMS = 10

/** Stripe allows 500 characters in a metadata value; descriptions are kept to the same. */
const MAX_DESCRIPTION_LENGTH = 500

/**
 * The title, an item and totals summary, and metadata for the Stripe
 * Checkout page and dashboard, e.g. `Tee · M × 2, Mug × 1 — Subtotal NZ$40.00 · …`.
 * The order number is left out: a card checkout only gets one once it is paid.
 */
export function stripeCheckoutDetails(
  order: Order,
  lines: Pick<OrderLineItem, 'productTitle' | 'variantTitle' | 'quantity'>[],
  settings: Pick<StoreSetting, 'currencyDisplay' | 'locale' | 'storeName'>
): StripeCheckoutDetails {
  const items = orderLineSummary(lines)
  const listed = items.slice(0, MAX_LISTED_ITEMS)
  if (items.length > listed.length) listed.push(`and ${items.length - listed.length} more`)
  const totals = orderTotals(order, moneyFormatFor(order, settings))
    .filter((total) => !total.strong)
    .map((total) => `${total.label} ${total.amount}`)

  const description = [listed.join(', '), totals.join(' · ')].filter(Boolean).join(' — ')
  const metadata: Record<string, string> = {
    item_count: String(lines.reduce((sum, line) => sum + line.quantity, 0)),
  }
  if (order.shippingTitle) metadata.shipping = order.shippingTitle
  if (order.discountCode) metadata.discount_code = order.discountCode

  return {
    title: `Your ${settings.storeName} order`,
    description:
      description.length > MAX_DESCRIPTION_LENGTH
        ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`
        : description || null,
    metadata,
  }
}

/**
 * Card payments for storefront orders. Checkout saves a hidden pending
 * checkout and the shopper pays on a Stripe Checkout page; the order is
 * only placed once the payment succeeds. The return URL and the Stripe
 * webhook both complete it; whichever arrives second is a no-op. Older
 * orders placed before payment are still marked paid the same way.
 */
@inject()
export default class StripePaymentService {
  constructor(
    protected orderRepository: OrderRepository,
    protected stripeGateway: StripeGatewayService,
    protected settlement: OrderPaymentSettlementService,
    protected refundService: RefundService,
    protected storeSettingService: StoreSettingService
  ) {}

  /**
   * Opens a Checkout Session for the order and returns the Stripe URL to
   * send the shopper to. Return URLs are built from `APP_URL`, never from
   * the request's Host header. Stripe's back link goes to the cancel URL
   * set on the Stripe setup; without one, a pending checkout returns to
   * the checkout page (the cart is still there), and an order placed
   * before payment returns signed-in owners to their account order page
   * (the thank-you page expires) and guests to the thank-you page.
   */
  async start(order: Order, { ownerSignedIn = false } = {}): Promise<string> {
    const origin = new URL(appUrl).origin
    const [lines, settings] = await Promise.all([
      this.orderRepository.lineItems(order.id),
      this.storeSettingService.get(),
    ])
    let cancelUrl = `${origin}/checkout/thank-you/${order.id}`
    if (order.isPendingCheckout) cancelUrl = `${origin}/checkout`
    else if (ownerSignedIn) cancelUrl = `${origin}/account/orders/${order.id}`
    const session = await this.stripeGateway.createCheckoutSession(
      order,
      stripeCheckoutDetails(order, lines, settings),
      {
        successUrl: `${origin}/checkout/orders/${order.id}/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl,
      }
    )
    await this.orderRepository.setPaymentReference(order.id, session.id)
    return session.url
  }

  /** Confirms the session on the return page; true when this call placed or paid the order. */
  async confirm(order: Order, sessionId: string): Promise<boolean> {
    const result = await this.stripeGateway.retrieveSession(sessionId)
    if (!result.paid || result.orderId !== order.id) return false
    if (!this.chargeMatches(result, order, sessionId)) return false
    return this.settle(order, sessionId)
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    const result = await this.stripeGateway.parseWebhook(payload, signature)
    if (!result) return
    if (result.kind === 'refund') {
      await this.refundService.handleProviderUpdate(result)
      return
    }
    if (!result.paid || !result.orderId) return
    const order = await this.orderRepository.find(result.orderId)
    if (!order) {
      logger.warn(
        { orderId: result.orderId, sessionId: result.sessionId },
        'Stripe paid an unknown order'
      )
      return
    }
    if (!this.chargeMatches(result, order, result.sessionId)) return
    await this.settle(order, result.sessionId)
  }

  protected settle(order: Order, sessionId: string): Promise<boolean> {
    return this.settlement.settle(order, sessionId, { autoRefund: true })
  }

  /**
   * A session paid for a different amount or currency (e.g. the order was
   * edited after checkout opened) must not mark the order paid.
   */
  protected chargeMatches(result: StripeSessionResult, order: Order, sessionId: string): boolean {
    if (chargeMatchesOrder(result, order)) return true
    logger.warn(
      {
        event: 'security.payment_mismatch',
        orderId: order.id,
        sessionId,
        charged: { amount: result.amountTotal, currency: result.currency },
        expected: { total: order.total, currency: order.currencyCode },
      },
      'Stripe charge does not match the order total'
    )
    return false
  }
}
