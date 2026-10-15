import type Order from '#models/order'
import { orderFulfillments } from '#transformers/order_fulfillments'
import OrderLineItemTransformer from '#transformers/order_line_item_transformer'
import OrderPaymentProofTransformer from '#transformers/order_payment_proof_transformer'
import RefundTransformer from '#transformers/refund_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

const SUMMARY_FIELDS = [
  'id',
  'draftNumber',
  'orderNumber',
  'status',
  'paymentStatus',
  'paymentMethod',
  'fulfillmentStatus',
  'archivedAt',
  'customerId',
  'email',
  'currencyCode',
  'subtotal',
  'total',
  'refundedTotal',
  'cancelledAt',
  'completedAt',
  'createdAt',
  'updatedAt',
] as const

/**
 * `customer` needs the `customer` preload; the detail variant also needs
 * `lineItems`.
 */
export default class OrderTransformer extends BaseTransformer<Order> {
  protected customer() {
    const customer = 'customer' in this.resource.$preloaded ? this.resource.customer : null
    return customer ? { id: customer.id, fullName: customer.fullName, email: customer.email } : null
  }

  toObject() {
    return {
      ...this.pick(this.resource, [...SUMMARY_FIELDS]),
      bankReference: this.resource.bankReference,
      customer: this.customer(),
    }
  }

  toDetail() {
    return {
      ...this.pick(this.resource, [
        ...SUMMARY_FIELDS,
        'shippingAddressId',
        'shippingAddress',
        'marketId',
        'pricesIncludeTax',
        'discountId',
        'discountCode',
        'discountTitle',
        'shippingDiscountId',
        'shippingDiscountCode',
        'shippingDiscountTitle',
        'shippingDiscountTotal',
        'shippingRateId',
        'shippingTitle',
        'shippingPrice',
        'taxName',
        'taxRate',
        'taxAppliesToShipping',
        'discountTotal',
        'shippingTotal',
        'taxTotal',
        'calculatedTotal',
        'totalOverrideReason',
        'cancelReason',
        'paidAt',
      ]),
      isTotalOverridden: this.resource.isTotalOverridden,
      canEditPlaced: this.resource.isEditablePlaced,
      bankReference: this.resource.bankReference,
      customer: this.customer(),
      lineItems: OrderLineItemTransformer.transform(this.resource.lineItems),
      fulfillments: orderFulfillments(this.resource),
      refunds:
        'refunds' in this.resource.$preloaded
          ? RefundTransformer.transform(this.resource.refunds)
          : [],
      paymentProof:
        'paymentProof' in this.resource.$preloaded && this.resource.paymentProof
          ? OrderPaymentProofTransformer.transform(this.resource.paymentProof)
          : null,
    }
  }
}
