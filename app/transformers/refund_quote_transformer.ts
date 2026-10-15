import type { RefundCalcResult } from '#services/refund_calculator'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** Suggested refund for the refund dialog. Nothing here is saved. */
export default class RefundQuoteTransformer extends BaseTransformer<RefundCalcResult> {
  toObject() {
    return this.pick(this.resource, [
      'lines',
      'shipping',
      'subtotal',
      'tax',
      'total',
      'maximum',
      'shippingRefundable',
    ])
  }
}
