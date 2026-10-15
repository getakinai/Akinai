import type Order from '#models/order'
import type { BankTransferConfig } from '#models/payment_method'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { bankTransferDetails } from '#transformers/checkout_payment_method_transformer'
import { orderFulfillments } from '#transformers/order_fulfillments'
import OrderPaymentProofTransformer from '#transformers/order_payment_proof_transformer'
import RefundTransformer from '#transformers/refund_transformer'

/**
 * The confirmation shown to the shopper after checkout. Needs the
 * `lineItems` preload.
 */
export default class CheckoutOrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'orderNumber',
        'email',
        'paymentMethod',
        'paymentStatus',
        'fulfillmentStatus',
        'currencyCode',
        'pricesIncludeTax',
        'shippingAddress',
        'shippingTitle',
        'taxName',
        'subtotal',
        'discountCode',
        'discountTitle',
        'discountTotal',
        'shippingDiscountTitle',
        'shippingDiscountTotal',
        'shippingTotal',
        'taxTotal',
        'total',
        'refundedTotal',
        'cancelledAt',
        'completedAt',
        'paidAt',
      ]),
      cancelled: this.resource.isCancelled,
      bankReference: this.resource.bankReference,
      bankTransfer: bankTransferDetails(
        (this.resource.$extras.bank_transfer as BankTransferConfig | null | undefined) ?? null
      ),
      lineItems: this.resource.lineItems.map((line) => ({
        id: line.id,
        productTitle: line.productTitle,
        variantTitle: line.variantTitle,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        fulfilledQuantity: line.fulfilledQuantity,
        lineTotal: line.lineTotal,
      })),
      fulfillments: orderFulfillments(this.resource, { successfulOnly: true }).map(
        ({ id: _id, status: _status, cancelledAt: _cancelledAt, ...shipment }) => shipment
      ),
      refunds:
        'refunds' in this.resource.$preloaded
          ? RefundTransformer.transform(
              this.resource.refunds.filter((refund) => refund.status !== 'failed')
            ).useVariant('toCustomer')
          : [],
      paymentProof:
        'paymentProof' in this.resource.$preloaded && this.resource.paymentProof
          ? OrderPaymentProofTransformer.transform(this.resource.paymentProof)
          : null,
    }
  }
}
