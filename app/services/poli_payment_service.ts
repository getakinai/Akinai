import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { appUrl } from '#config/app'
import type Order from '#models/order'
import OrderRepository from '#repositories/order_repository'
import OrderPaymentSettlementService from '#services/order_payment_settlement_service'
import PoliGatewayService, {
  poliPaymentMatchesOrder,
  type PoliTransactionResult,
} from '#services/poli_gateway_service'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Online bank payments with POLi. Checkout saves a hidden pending checkout
 * and the shopper pays on POLi's page; the order is only placed once POLi
 * confirms the payment. The return URL and POLi's nudge both look the
 * transaction up with POLi before settling; whichever arrives second is a
 * no-op. POLi can't refund, so refunds are always made by hand.
 */
@inject()
export default class PoliPaymentService {
  constructor(
    protected orderRepository: OrderRepository,
    protected poliGateway: PoliGatewayService,
    protected settlement: OrderPaymentSettlementService
  ) {}

  /**
   * Starts a POLi transaction for the order and returns POLi's URL to send
   * the shopper to. URLs are built from `APP_URL`, never from the request's
   * Host header. The order id is the merchant reference.
   */
  async start(order: Order): Promise<string> {
    const origin = new URL(appUrl).origin
    const returnUrl = `${origin}/checkout/orders/${order.id}/poli-return`
    const transaction = await this.poliGateway.initiate(order, {
      homepageUrl: origin,
      successUrl: `${returnUrl}?status=success`,
      failureUrl: `${returnUrl}?status=failure`,
      cancellationUrl: `${returnUrl}?status=cancelled`,
      notificationUrl: `${origin}/poli/nudge`,
    })
    await this.orderRepository.setPaymentReference(order.id, transaction.token)
    return transaction.navigateUrl
  }

  /**
   * Confirms the payment on the return page; true when this call placed or
   * paid the order. Uses the token POLi sent back, or the one saved when
   * the transaction started.
   */
  async confirm(order: Order, token: string | null): Promise<boolean> {
    const lookup = token ?? order.paymentReference
    if (order.paymentMethod !== 'poli' || !lookup) return false
    const result = await this.poliGateway.getTransaction(lookup)
    if (result.merchantReference !== order.id) {
      logger.warn(
        { event: 'security.poli_reference_mismatch', orderId: order.id, status: result.status },
        'POLi transaction belongs to another order'
      )
      return false
    }
    if (!this.isPaid(result, order.id)) return false
    if (!this.paymentMatches(result, order)) return false
    return this.settle(order, lookup)
  }

  /**
   * POLi's nudge carries only a token. The transaction is looked up with
   * POLi, so a forged nudge can't mark anything paid.
   */
  async handleNudge(token: string): Promise<void> {
    const result = await this.poliGateway.getTransaction(token)
    const orderId = result.merchantReference
    if (!orderId || !UUID.test(orderId)) {
      logger.warn({ status: result.status }, 'POLi nudge without a known merchant reference')
      return
    }
    if (!this.isPaid(result, orderId)) return
    const order = await this.orderRepository.find(orderId)
    if (!order || order.paymentMethod !== 'poli') {
      logger.warn({ orderId }, 'POLi paid an unknown order')
      return
    }
    if (!this.paymentMatches(result, order)) return
    await this.settle(order, token)
  }

  protected settle(order: Order, token: string): Promise<boolean> {
    return this.settlement.settle(order, token, { autoRefund: false })
  }

  /** `ReceiptUnverified` means POLi couldn't confirm the bank receipt; it stays unpaid. */
  protected isPaid(result: PoliTransactionResult, orderId: string): boolean {
    if (result.paid) return true
    if (result.status === 'ReceiptUnverified') {
      logger.warn(
        { event: 'poli.receipt_unverified', orderId },
        'POLi could not verify the bank receipt; check the payment before marking the order paid'
      )
    }
    return false
  }

  /**
   * A transaction paid for a different amount or currency (e.g. the order
   * was edited after POLi opened) must not mark the order paid.
   */
  protected paymentMatches(result: PoliTransactionResult, order: Order): boolean {
    if (poliPaymentMatchesOrder(result, order)) return true
    logger.warn(
      {
        event: 'security.payment_mismatch',
        orderId: order.id,
        provider: 'poli',
        paid: { amount: result.amountPaid, currency: result.currency },
        expected: { total: order.total, currency: order.currencyCode },
      },
      'POLi payment does not match the order total'
    )
    return false
  }
}
