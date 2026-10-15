import type OrderPaymentProof from '#models/order_payment_proof'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Proof of payment on an order, for the customer and staff. The image is
 * fetched from the order's authenticated image route; its storage key is
 * never exposed.
 */
export default class OrderPaymentProofTransformer extends BaseTransformer<OrderPaymentProof> {
  toObject() {
    return {
      ...this.pick(this.resource, ['details', 'submittedAt', 'reviewedAt', 'rejectionReason']),
      hasImage: this.resource.imageKey !== null,
    }
  }
}
