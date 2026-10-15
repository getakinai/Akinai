import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { errors } from '@vinejs/vine'
import BusinessRuleException from '#exceptions/business_rule_exception'
import type Order from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import type Refund from '#models/refund'
import OrderRepository from '#repositories/order_repository'
import RefundRepository, {
  type RefundChange,
  type RefundPlan,
} from '#repositories/refund_repository'
import ReturnRepository from '#repositories/return_repository'
import AuditLogService from '#services/audit_log_service'
import LocationService from '#services/location_service'
import OrderNotificationService from '#services/order_notification_service'
import {
  calculateRefund,
  RefundCalculationError,
  type RefundCalcResult,
} from '#services/refund_calculator'
import StripeGatewayService, {
  toStripeAmount,
  type StripeRefundResult,
} from '#services/stripe_gateway_service'
import { orNullIfMissing } from '#utils/or_null_if_missing'
import { roundMoney } from '#utils/money'

export type RefundLinesInput = {
  lines: { lineItemId: string; quantity: number }[]
  /** Shipping to refund, before tax. */
  shipping: number
}

export type RefundInput = RefundLinesInput & {
  /** Lower (or exact) amount to refund; defaults to the calculated amount. */
  amount?: number | null
  restock: boolean
  /** Where shipped units go back into stock; defaults to the default location. */
  locationId?: string | null
  note?: string | null
  notifyCustomer: boolean
  returnId?: string | null
}

function validationError(error: RefundCalculationError): never {
  throw new errors.E_VALIDATION_ERROR([
    { field: error.field, message: error.message, rule: 'refund' },
  ])
}

/**
 * Refunds on placed orders. Card orders are refunded through Stripe; bank
 * transfer and staff-completed orders are recorded as manual refunds that
 * staff pay out themselves.
 */
@inject()
export default class RefundService {
  constructor(
    protected refundRepository: RefundRepository,
    protected orderRepository: OrderRepository,
    protected stripeGateway: StripeGatewayService,
    protected locationService: LocationService,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService,
    protected returnRepository: ReturnRepository
  ) {}

  async listForOrder(orderId: string): Promise<Refund[]> {
    return this.refundRepository.listForOrder(orderId)
  }

  /** Suggested refund for the selected lines and shipping. */
  async calculate(order: Order, input: RefundLinesInput): Promise<RefundCalcResult> {
    const [lines, refundedShipping] = await Promise.all([
      this.orderRepository.lineItems(order.id),
      this.refundRepository.refundedShipping(order.id),
    ])
    return this.compute(order, lines, refundedShipping, input)
  }

  /**
   * Records the refund (locking the order), then sends it to Stripe for
   * card orders. A refund Stripe rejects is reversed and reported as a 422.
   */
  async create(order: Order, input: RefundInput, userId: string | null): Promise<Refund> {
    const method = this.methodFor(order)
    if (input.returnId) await this.checkReturn(order, input.returnId)
    if (input.restock && input.locationId) {
      const location = await orNullIfMissing(this.locationService.findOrFail(input.locationId))
      if (!location?.isActive) {
        validationError(new RefundCalculationError('locationId', 'Choose an active location'))
      }
    }
    const change = await this.refundRepository.create({
      orderId: order.id,
      returnId: input.returnId ?? null,
      method,
      status: method === 'stripe' ? 'pending' : 'succeeded',
      note: input.note ?? null,
      createdByUserId: userId,
      restock: input.restock,
      restockLocationId: input.locationId ?? null,
      committedLocationId: await this.defaultLocationId(),
      plan: (locked, lines, refundedShipping) => this.plan(locked, lines, refundedShipping, input),
    })

    const refund = method === 'stripe' ? await this.sendToStripe(order, change) : change.refund
    if (input.returnId) await this.returnRepository.close(input.returnId, refund.id)
    await this.recordRefunded(change)
    if (input.notifyCustomer) {
      await this.orderNotificationService.refunded(order.id, refund.id)
    }
    return refund
  }

  /**
   * Refunds everything still refundable: every unrefunded unit and the
   * remaining shipping, for the full refundable amount (used when
   * cancelling a paid order).
   */
  async refundAll(
    order: Order,
    options: { restock: boolean; note: string | null; notifyCustomer: boolean },
    userId: string | null
  ): Promise<Refund> {
    const lines = await this.orderRepository.lineItems(order.id)
    const refundedShipping = await this.refundRepository.refundedShipping(order.id)
    return this.create(
      order,
      {
        lines: lines
          .filter((line) => line.quantity > line.refundedQuantity)
          .map((line) => ({
            lineItemId: line.id,
            quantity: line.quantity - line.refundedQuantity,
          })),
        shipping: roundMoney(Math.max(order.shippingTotal - refundedShipping, 0)),
        amount: order.refundableTotal,
        restock: options.restock,
        note: options.note,
        notifyCustomer: options.notifyCustomer,
      },
      userId
    )
  }

  /**
   * Applies a Stripe `refund.*` webhook. Settled refunds are ignored, so
   * repeated events are safe; an amount that doesn't match ours is logged
   * and ignored.
   */
  async handleProviderUpdate(result: StripeRefundResult): Promise<void> {
    const refund =
      (await this.refundRepository.findByProviderId(result.id)) ??
      (result.refundId ? await this.refundRepository.find(result.refundId) : null)
    if (!refund || refund.status !== 'pending') return

    if (result.amount !== toStripeAmount(refund.amount)) {
      logger.warn(
        {
          event: 'security.refund_mismatch',
          refundId: refund.id,
          providerRefundId: result.id,
          amount: result.amount,
        },
        'Stripe refund amount does not match the recorded refund'
      )
      return
    }
    if (!refund.providerRefundId) {
      await this.refundRepository.setProviderRefundId(refund, result.id)
    }

    if (result.status === 'succeeded') {
      await this.refundRepository.markSucceeded(refund.id)
      return
    }
    if (result.status === 'failed') {
      const change = await this.refundRepository.reverse(
        refund.id,
        result.failureReason ?? 'Stripe could not complete the refund',
        await this.defaultLocationId()
      )
      if (!change) return
      await this.returnRepository.reopenAfterFailedRefund(refund.id)
      logger.warn(
        {
          event: 'refund_failed',
          orderId: change.order.id,
          refundId: refund.id,
          reason: result.failureReason,
        },
        'Stripe refund failed and was reversed'
      )
      await this.recordReversed(change, { userId: null, customerId: null, ipAddress: null })
    }
  }

  /** A refund for a return must be for an approved or received return on the same order. */
  protected async checkReturn(order: Order, returnId: string) {
    const ret = await this.returnRepository.find(returnId)
    if (!ret || ret.orderId !== order.id) {
      validationError(new RefundCalculationError('returnId', 'This return is not on the order'))
    }
    if (ret.status !== 'approved' && ret.status !== 'received') {
      validationError(
        new RefundCalculationError('returnId', 'Only approved or received returns can be refunded')
      )
    }
  }

  protected methodFor(order: Order) {
    return order.paymentMethod === 'stripe' && order.paymentReference ? 'stripe' : 'manual'
  }

  protected async sendToStripe(order: Order, change: RefundChange): Promise<Refund> {
    const { refund } = change
    let result: StripeRefundResult
    try {
      result = await this.stripeGateway.refund(order.paymentReference!, refund.amount, {
        idempotencyKey: refund.id,
        orderId: order.id,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Stripe could not refund this payment'
      await this.failImmediately(refund, message)
      throw new BusinessRuleException(`Stripe refused the refund: ${message}`)
    }

    await this.refundRepository.setProviderRefundId(refund, result.id)
    if (result.status === 'failed') {
      const message = result.failureReason ?? 'Stripe could not refund this payment'
      await this.failImmediately(refund, message)
      throw new BusinessRuleException(`Stripe refused the refund: ${message}`)
    }
    if (result.status === 'succeeded') {
      await this.refundRepository.markSucceeded(refund.id)
      refund.status = 'succeeded'
    }
    return refund
  }

  protected async failImmediately(refund: Refund, reason: string) {
    logger.warn(
      { event: 'refund_failed', orderId: refund.orderId, refundId: refund.id, reason },
      'Stripe rejected a refund'
    )
    const change = await this.refundRepository.reverse(
      refund.id,
      reason,
      await this.defaultLocationId()
    )
    if (change) await this.recordReversed(change)
  }

  protected plan(
    order: Order,
    lines: OrderLineItem[],
    refundedShipping: number,
    input: RefundInput
  ): RefundPlan {
    const result = this.compute(order, lines, refundedShipping, input)
    const amount = input.amount ?? result.total
    if (amount > result.maximum) {
      validationError(
        new RefundCalculationError(
          'amount',
          `Only ${result.maximum.toFixed(2)} can still be refunded`
        )
      )
    }
    return { lines: result.lines, shipping: result.shipping, amount }
  }

  protected compute(
    order: Order,
    lines: OrderLineItem[],
    refundedShipping: number,
    input: RefundLinesInput
  ): RefundCalcResult {
    try {
      return calculateRefund(order, lines, { ...input, refundedShipping })
    } catch (error) {
      if (error instanceof RefundCalculationError) validationError(error)
      throw error
    }
  }

  protected async defaultLocationId() {
    const location = await this.locationService.findDefault()
    return location?.id ?? null
  }

  protected async recordRefunded({ refund, order, before }: RefundChange) {
    await this.auditLogService.recordOrderEvent(order, 'refunded', {
      before: { refundedTotal: before.refundedTotal, paymentStatus: before.paymentStatus },
      after: {
        refundedTotal: order.refundedTotal,
        paymentStatus: order.paymentStatus,
        refund: refund.amount,
        method: refund.method,
        restocked: refund.lines.some((line) => line.restock),
      },
    })
  }

  protected async recordReversed(
    { refund, order, before }: RefundChange,
    fallback?: { userId: null; customerId: null; ipAddress: null }
  ) {
    await this.auditLogService.recordOrderEvent(
      order,
      'updated',
      {
        before: { refundedTotal: before.refundedTotal, paymentStatus: before.paymentStatus },
        after: {
          refundedTotal: order.refundedTotal,
          paymentStatus: order.paymentStatus,
          refundFailed: refund.failureReason,
        },
      },
      fallback
    )
  }
}
