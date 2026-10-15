import type Refund from '#models/refund'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * A refund with its lines. Needs the `lines` preload; `createdBy` is shown
 * when preloaded. `toCustomer` leaves out staff notes and who issued it.
 */
export default class RefundTransformer extends BaseTransformer<Refund> {
  protected lines() {
    return this.resource.lines.map((line) => ({
      lineItemId: line.orderLineItemId,
      quantity: line.quantity,
      amount: line.amount,
    }))
  }

  toObject() {
    const createdBy = 'createdBy' in this.resource.$preloaded ? this.resource.createdBy : null
    return {
      ...this.pick(this.resource, [
        'id',
        'returnId',
        'amount',
        'shippingAmount',
        'method',
        'status',
        'note',
        'failureReason',
        'createdAt',
      ]),
      createdBy: createdBy ? (createdBy.fullName ?? createdBy.email) : null,
      lines: this.resource.lines.map((line) => ({
        lineItemId: line.orderLineItemId,
        quantity: line.quantity,
        amount: line.amount,
        restock: line.restock,
      })),
    }
  }

  toCustomer() {
    return {
      ...this.pick(this.resource, ['id', 'amount', 'shippingAmount', 'method', 'createdAt']),
      lines: this.lines(),
    }
  }
}
