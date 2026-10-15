import type OrderReturn from '#models/order_return'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { orderAuditLabel } from '#services/order_audit'

/**
 * A return with its lines (needs the `lines` preload). `toCustomer` leaves
 * out the staff note; `toListItem` adds the order and customer (needs the
 * `order.customer` preload and the `itemCount` aggregate).
 */
export default class ReturnTransformer extends BaseTransformer<OrderReturn> {
  protected lines() {
    return this.resource.lines.map((line) => ({
      id: line.id,
      lineItemId: line.orderLineItemId,
      quantity: line.quantity,
      reason: line.reason,
      note: line.note,
      restock: line.restock,
      locationId: line.locationId,
    }))
  }

  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'orderId',
        'number',
        'status',
        'customerNote',
        'declineReason',
        'staffNote',
        'refundId',
        'requestedAt',
        'approvedAt',
        'receivedAt',
        'closedAt',
      ]),
      lines: this.lines(),
    }
  }

  toCustomer() {
    return {
      ...this.pick(this.resource, [
        'id',
        'number',
        'status',
        'customerNote',
        'declineReason',
        'requestedAt',
        'approvedAt',
        'receivedAt',
        'closedAt',
      ]),
      lines: this.resource.lines.map((line) => ({
        lineItemId: line.orderLineItemId,
        quantity: line.quantity,
        reason: line.reason,
      })),
    }
  }

  toListItem() {
    const order = this.resource.order
    const customer = order?.customer ?? null
    return {
      ...this.pick(this.resource, [
        'id',
        'orderId',
        'number',
        'status',
        'requestedAt',
        'createdAt',
      ]),
      itemCount: Number(this.resource.$extras.itemCount ?? 0),
      order: order ? { id: order.id, label: orderAuditLabel(order), email: order.email } : null,
      customer: customer
        ? { id: customer.id, fullName: customer.fullName, email: customer.email }
        : null,
    }
  }
}
