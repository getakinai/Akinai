import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors } from '@vinejs/vine'
import Order, { type OrderPaymentStatus } from '#models/order'
import OrderLineItem from '#models/order_line_item'
import Refund, { type RefundMethod, type RefundStatus } from '#models/refund'
import RefundLineItem from '#models/refund_line_item'
import { rollupFulfillment, unfulfilledQuantity } from '#repositories/fulfillment_repository'
import { caseIncrement } from '#repositories/helpers/case_increment'
import { applyStockMoves, type StockMove } from '#repositories/helpers/stock_moves'
import { roundMoney } from '#utils/money'

export type RefundPlan = {
  lines: { lineItemId: string; quantity: number; amount: number }[]
  /** Shipping refunded, before tax. */
  shipping: number
  amount: number
}

export type CreateRefundData = {
  orderId: string
  returnId: string | null
  method: RefundMethod
  status: RefundStatus
  note: string | null
  createdByUserId: string | null
  /** Put the refunded units back into `available`. */
  restock: boolean
  /** Where shipped units go back into stock. */
  restockLocationId: string | null
  /** Where unshipped units are committed (the default location). */
  committedLocationId: string | null
  /** Builds the refund from the locked order, so amounts can't race other refunds. */
  plan: (order: Order, lines: OrderLineItem[], refundedShipping: number) => RefundPlan
}

export type RefundChange = {
  refund: Refund
  order: Order
  before: { refundedTotal: number; paymentStatus: OrderPaymentStatus | null }
}

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'refund' }])
}

/** Payment status from what has been refunded so far. */
function refundPaymentStatus(order: Order, refundedTotal: number): OrderPaymentStatus {
  if (refundedTotal <= 0) return 'paid'
  return refundedTotal >= order.total ? 'refunded' : 'partially_refunded'
}

export default class RefundRepository {
  async find(id: string): Promise<Refund | null> {
    return Refund.find(id)
  }

  async findByProviderId(providerRefundId: string): Promise<Refund | null> {
    return Refund.findBy('provider_refund_id', providerRefundId)
  }

  async listForOrder(orderId: string): Promise<Refund[]> {
    return Refund.query()
      .where('order_id', orderId)
      .preload('lines')
      .preload('createdBy', (query) => query.select('id', 'full_name', 'email'))
      .orderBy('created_at', 'desc')
      .limit(100)
  }

  async findWithLinesOrFail(id: string): Promise<Refund> {
    return Refund.query().where('id', id).preload('lines').firstOrFail()
  }

  /** Shipping refunded so far (pending or succeeded), before tax. */
  async refundedShipping(orderId: string, client?: TransactionClientContract): Promise<number> {
    const row = await (client ?? db)
      .from('refunds')
      .where('order_id', orderId)
      .whereNot('status', 'failed')
      .sum('shipping_amount as total')
      .first()
    return Number(row?.total ?? 0)
  }

  /**
   * Records a refund in one transaction: locks the order, rebuilds the
   * refund from the locked rows, inserts it with its lines, reserves the
   * amount in `refunded_total`, updates the lines' refunded and removed
   * quantities, moves stock and recomputes the payment and fulfillment
   * statuses. Throws a validation error (and rolls back) when the amount is
   * not refundable.
   */
  async create(data: CreateRefundData): Promise<RefundChange> {
    return db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('id', data.orderId)
        .forUpdate()
        .firstOrFail()
      if (order.isDraft) fieldError('order', 'Drafts have no payment to refund')
      if (!order.isPaid) fieldError('order', 'This order has no payment to refund')
      const before = { refundedTotal: order.refundedTotal, paymentStatus: order.paymentStatus }

      const lines = await OrderLineItem.query({ client: trx })
        .where('order_id', order.id)
        .forUpdate()
      const plan = data.plan(order, lines, await this.refundedShipping(order.id, trx))
      const amount = roundMoney(plan.amount)
      if (amount <= 0) fieldError('amount', 'Enter an amount to refund')
      if (amount > order.refundableTotal) {
        fieldError('amount', `Only ${order.refundableTotal.toFixed(2)} can still be refunded`)
      }

      const linesById = new Map(lines.map((line) => [line.id, line]))
      const refundLines = plan.lines.map((planned) => {
        const line = linesById.get(planned.lineItemId)!
        const removed = Math.min(planned.quantity, unfulfilledQuantity(line))
        return { ...planned, line, removed }
      })

      const refund = await Refund.create(
        {
          orderId: order.id,
          returnId: data.returnId,
          amount,
          shippingAmount: roundMoney(plan.shipping),
          method: data.method,
          status: data.status,
          providerRefundId: null,
          note: data.note,
          failureReason: null,
          createdByUserId: data.createdByUserId,
        },
        { client: trx }
      )
      const restockLocationId = data.restockLocationId ?? data.committedLocationId
      if (refundLines.length > 0) {
        await RefundLineItem.createMany(
          refundLines.map(({ lineItemId, quantity, amount: lineAmount, line, removed }) => ({
            refundId: refund.id,
            orderLineItemId: lineItemId,
            quantity,
            removedQuantity: removed,
            amount: lineAmount,
            restock: data.restock && line.productVariantId !== null,
            locationId: data.restock ? restockLocationId : null,
          })),
          { client: trx }
        )
      }

      await this.applyLines(
        order,
        lines,
        refundLines.map(({ lineItemId, quantity, removed, line }) => ({
          lineItemId,
          variantId: line.productVariantId,
          quantity,
          removed,
          restock: data.restock,
        })),
        1,
        { committed: data.committedLocationId, restock: restockLocationId },
        trx
      )

      const refundedTotal = roundMoney(order.refundedTotal + amount)
      order.useTransaction(trx)
      order.$skipAudit = true
      order.merge({ refundedTotal, paymentStatus: refundPaymentStatus(order, refundedTotal) })
      await order.save()

      await refund.load('lines')
      return { refund, order, before }
    })
  }

  async setProviderRefundId(refund: Refund, providerRefundId: string): Promise<void> {
    await Refund.query()
      .where('id', refund.id)
      .update({ provider_refund_id: providerRefundId, updated_at: new Date() })
    refund.providerRefundId = providerRefundId
  }

  /** Marks a pending refund succeeded. False when it was already settled. */
  async markSucceeded(refundId: string): Promise<boolean> {
    const updated = await Refund.query()
      .where('id', refundId)
      .where('status', 'pending')
      .update({ status: 'succeeded', updated_at: new Date() })
    return Number(updated[0] ?? 0) > 0
  }

  /**
   * Undoes a refund that the payment provider rejected: marks it failed,
   * gives the amount back to the order's refundable total, restores the
   * lines' quantities and reverses the stock it moved. Returns null when
   * the refund is not pending (already settled), so repeated webhooks are
   * no-ops.
   */
  async reverse(
    refundId: string,
    failureReason: string,
    committedLocationId: string | null
  ): Promise<RefundChange | null> {
    return db.transaction(async (trx) => {
      const refund = await Refund.query({ client: trx }).where('id', refundId).forUpdate().first()
      if (!refund || refund.status !== 'pending') return null

      const order = await Order.query({ client: trx })
        .where('id', refund.orderId)
        .forUpdate()
        .firstOrFail()
      const before = { refundedTotal: order.refundedTotal, paymentStatus: order.paymentStatus }
      const lines = await OrderLineItem.query({ client: trx })
        .where('order_id', order.id)
        .forUpdate()
      const refundLines = await RefundLineItem.query({ client: trx }).where('refund_id', refund.id)
      const linesById = new Map(lines.map((line) => [line.id, line]))

      await this.applyLines(
        order,
        lines,
        refundLines.map((refundLine) => ({
          lineItemId: refundLine.orderLineItemId,
          variantId: linesById.get(refundLine.orderLineItemId)?.productVariantId ?? null,
          quantity: refundLine.quantity,
          removed: refundLine.removedQuantity,
          restock: refundLine.restock,
          restockLocationId: refundLine.locationId,
        })),
        -1,
        { committed: committedLocationId, restock: null },
        trx
      )

      const refundedTotal = roundMoney(Math.max(order.refundedTotal - refund.amount, 0))
      order.useTransaction(trx)
      order.$skipAudit = true
      order.merge({ refundedTotal, paymentStatus: refundPaymentStatus(order, refundedTotal) })
      await order.save()

      refund.useTransaction(trx)
      await refund.merge({ status: 'failed', failureReason: failureReason.slice(0, 500) }).save()
      await refund.load('lines')
      return { refund, order, before }
    })
  }

  /**
   * Moves refunded quantities into (`direction` 1) or out of (-1) the
   * order lines, with their stock: unshipped units leave `committed`, and
   * restocked units go back to `available`.
   */
  protected async applyLines(
    order: Order,
    lines: OrderLineItem[],
    changes: {
      lineItemId: string
      variantId: string | null
      quantity: number
      removed: number
      restock: boolean
      restockLocationId?: string | null
    }[],
    direction: 1 | -1,
    locations: { committed: string | null; restock: string | null },
    trx: TransactionClientContract
  ) {
    if (changes.length === 0) return
    await caseIncrement(
      trx,
      'order_line_items',
      'refunded_quantity',
      changes.map(({ lineItemId, quantity }) => ({ id: lineItemId, change: quantity * direction })),
      { floorAtZero: true }
    )
    await caseIncrement(
      trx,
      'order_line_items',
      'removed_quantity',
      changes.map(({ lineItemId, removed }) => ({ id: lineItemId, change: removed * direction })),
      { floorAtZero: true }
    )

    const moves: StockMove[] = []
    for (const change of changes) {
      if (!change.variantId) continue
      const shipped = change.quantity - change.removed
      if (locations.committed && change.removed > 0) {
        moves.push({
          variantId: change.variantId,
          locationId: locations.committed,
          committed: -change.removed * direction,
          available: change.restock ? change.removed * direction : 0,
        })
      }
      const restockAt = change.restockLocationId ?? locations.restock
      if (change.restock && restockAt && shipped > 0) {
        moves.push({
          variantId: change.variantId,
          locationId: restockAt,
          committed: 0,
          available: shipped * direction,
        })
      }
    }
    await applyStockMoves(trx, moves)

    const removedByLine = new Map(changes.map((change) => [change.lineItemId, change.removed]))
    const next = lines.map((line) => ({
      quantity: line.quantity,
      fulfilledQuantity: line.fulfilledQuantity,
      removedQuantity: Math.max(
        line.removedQuantity + (removedByLine.get(line.id) ?? 0) * direction,
        0
      ),
    }))
    const fallback = order.hasFulfilledItems ? 'unfulfilled' : order.fulfillmentStatus
    order.fulfillmentStatus = rollupFulfillment(next, fallback)
  }
}
