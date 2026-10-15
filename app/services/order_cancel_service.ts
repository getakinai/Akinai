import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import BusinessRuleException from '#exceptions/business_rule_exception'
import type { CancelReason } from '#models/order'
import type Order from '#models/order'
import type Refund from '#models/refund'
import OrderRepository from '#repositories/order_repository'
import AuditLogService from '#services/audit_log_service'
import LocationService from '#services/location_service'
import OrderNotificationService from '#services/order_notification_service'
import RefundService from '#services/refund_service'
import StripeGatewayService from '#services/stripe_gateway_service'

export type CancelOrderInput = {
  reason: CancelReason
  restock: boolean
  refund: boolean
  notifyCustomer: boolean
  staffNote?: string | null
}

/**
 * Staff cancellation of a placed order: releases its stock, voids an
 * unpaid payment (closing an open Stripe Checkout page) or refunds a paid
 * one, then tells the customer.
 */
@inject()
export default class OrderCancelService {
  constructor(
    protected orderRepository: OrderRepository,
    protected refundService: RefundService,
    protected stripeGateway: StripeGatewayService,
    protected locationService: LocationService,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  async cancel(order: Order, input: CancelOrderInput, userId: string): Promise<Order> {
    const before = { status: order.status, paymentStatus: order.paymentStatus }
    const location = await this.locationService.findDefault()
    const { order: cancelled, released } = await this.orderRepository.cancel(order.id, {
      reason: input.reason,
      restock: input.restock,
      locationId: location?.id ?? null,
    })

    await this.auditLogService.recordOrderEvent(cancelled, 'cancelled', {
      before,
      after: {
        status: cancelled.status,
        paymentStatus: cancelled.paymentStatus,
        cancelReason: input.reason,
        restocked: input.restock ? released : 0,
        staffNote: input.staffNote ?? null,
      },
    })

    if (cancelled.paymentStatus === 'voided') await this.closeCheckout(cancelled)

    let refund: Refund | null = null
    if (input.refund && cancelled.isPaid && cancelled.refundableTotal > 0) {
      try {
        // Stock was already released above, so the refund must not restock again.
        refund = await this.refundService.refundAll(
          cancelled,
          { restock: false, note: input.staffNote ?? null, notifyCustomer: false },
          userId
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The refund failed'
        throw new BusinessRuleException(
          `The order was cancelled, but the refund failed: ${message}. Refund it from the order page.`
        )
      }
    }

    if (input.notifyCustomer) {
      await this.orderNotificationService.cancelled(cancelled.id, { refundId: refund?.id ?? null })
    }
    return this.orderRepository.findDetailOrFail(cancelled.id)
  }

  /**
   * Expires the order's open Stripe Checkout page so it can't be paid. A
   * payment that still slips through is refunded by OrderPaymentSettlementService.
   */
  protected async closeCheckout(order: Order) {
    if (order.paymentMethod !== 'stripe' || !order.paymentReference) return
    try {
      await this.stripeGateway.expireSession(order.paymentReference)
    } catch (error) {
      logger.warn(
        { err: error, event: 'stripe_session_expire_failed', orderId: order.id },
        'Could not expire the Stripe Checkout session of a cancelled order'
      )
    }
  }
}
