import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import type Order from '#models/order'
import OrderRepository from '#repositories/order_repository'
import AuditLogService from '#services/audit_log_service'
import LocationService from '#services/location_service'
import { placedChanges } from '#services/order_audit'
import OrderNotificationService from '#services/order_notification_service'
import RefundService from '#services/refund_service'

export type SettleOptions = {
  /**
   * Refund a payment that lands after the order was cancelled straight
   * away. Only for providers we can refund through (Stripe); others are
   * logged for staff to refund by hand.
   */
  autoRefund: boolean
}

/**
 * Marks orders paid once an online payment provider (Stripe, POLi) has
 * confirmed the payment. The return page and the provider's notification
 * both call `settle`; whichever arrives second is a no-op.
 */
@inject()
export default class OrderPaymentSettlementService {
  constructor(
    protected orderRepository: OrderRepository,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService,
    protected refundService: RefundService,
    protected locationService: LocationService
  ) {}

  /** True when this call placed or paid the order. */
  settle(order: Order, reference: string, options: SettleOptions): Promise<boolean> {
    return order.isPendingCheckout
      ? this.completeCheckout(order.id, reference)
      : this.markPaid(order.id, reference, options)
  }

  /**
   * Places a paid pending checkout: assigns the order number, commits stock
   * and sends the order emails. Stock that ran out while the shopper was
   * paying goes below zero and is logged for staff.
   */
  protected async completeCheckout(orderId: string, reference: string): Promise<boolean> {
    const location = await this.locationService.findDefault()
    const result = await this.orderRepository.completePaidCheckout(
      orderId,
      reference,
      location?.id ?? null
    )
    if (!result) return false
    if (result.oversold.length > 0) {
      logger.warn(
        { event: 'checkout.oversold', orderId, reference, lines: result.oversold },
        'A paid online order was placed with short stock'
      )
    }

    const placed = await this.orderRepository.findDetailOrFail(orderId)
    const actor = { userId: null, customerId: placed.customerId, ipAddress: null }
    await this.auditLogService.recordOrderEvent(placed, 'placed', placedChanges(placed), actor)
    await this.auditLogService.recordOrderEvent(
      placed,
      'paid',
      {
        before: { paymentStatus: null },
        after: { paymentStatus: 'paid', paymentReference: reference },
      },
      actor
    )
    await this.orderNotificationService.orderPlaced(placed.id, { notifyStaff: true })
    return true
  }

  /** Logs the payment only for the call that actually marked the order paid. */
  protected async markPaid(
    orderId: string,
    reference: string,
    options: SettleOptions
  ): Promise<boolean> {
    const marked = await this.orderRepository.markPaid(orderId, reference)
    if (!marked) {
      await this.paidAfterCancel(orderId, reference, options)
      return false
    }
    const order = await this.orderRepository.findOrFail(orderId)
    await this.auditLogService.recordOrderEvent(
      order,
      'paid',
      {
        before: { paymentStatus: 'pending' },
        after: { paymentStatus: 'paid', paymentReference: reference },
      },
      { userId: null, customerId: null, ipAddress: null }
    )
    await this.orderNotificationService.orderPlaced(order.id, { notifyStaff: true })
    return true
  }

  /**
   * A payment that lands after staff cancelled the order (the payment page
   * was still open) is recorded, then refunded in full straight away when
   * the provider supports it. Otherwise staff refund it by hand.
   */
  protected async paidAfterCancel(orderId: string, reference: string, options: SettleOptions) {
    const marked = await this.orderRepository.markPaidAfterCancel(orderId, reference)
    if (!marked) return
    const system = { userId: null, customerId: null, ipAddress: null }
    logger.warn(
      { event: 'paid_after_cancel', orderId, reference, autoRefund: options.autoRefund },
      options.autoRefund
        ? 'Payment received for a cancelled order; refunding it'
        : 'Payment received for a cancelled order; refund it from the order page'
    )
    const order = await this.orderRepository.findOrFail(orderId)
    await this.auditLogService.recordOrderEvent(
      order,
      'paid',
      {
        before: { paymentStatus: 'voided' },
        after: { paymentStatus: 'paid', paymentReference: reference },
      },
      system
    )
    if (!options.autoRefund) return
    try {
      await this.refundService.refundAll(
        order,
        {
          restock: false,
          note: 'Paid after the order was cancelled',
          notifyCustomer: true,
        },
        null
      )
    } catch (error) {
      logger.error(
        { err: error, event: 'paid_after_cancel_refund_failed', orderId, reference },
        'Could not refund a payment received after cancellation; refund it from the order page'
      )
    }
  }
}
