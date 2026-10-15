import type OrderLineItem from '#models/order_line_item'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrderLineItemTransformer extends BaseTransformer<OrderLineItem> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'productVariantId',
      'productTitle',
      'variantTitle',
      'sku',
      'unitPrice',
      'quantity',
      'fulfilledQuantity',
      'refundedQuantity',
      'removedQuantity',
      'lineTotal',
      'discountAllocation',
      'position',
    ])
  }
}
