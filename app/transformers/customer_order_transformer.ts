import type Order from '#models/order'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * An order card on the customer's account dashboard. Expects the
 * `itemCount` aggregate from `OrderRepository.paginateForCustomer`.
 */
export default class CustomerOrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'orderNumber',
        'paymentStatus',
        'paymentMethod',
        'fulfillmentStatus',
        'currencyCode',
        'shippingTitle',
        'total',
        'completedAt',
        'createdAt',
      ]),
      cancelled: this.resource.isCancelled,
      itemCount: Number(this.resource.$extras.itemCount ?? 0),
    }
  }
}
