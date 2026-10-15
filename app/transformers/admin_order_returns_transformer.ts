import { BaseTransformer } from '@adonisjs/core/transformers'
import type { StaffReturnsOverview } from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'

/** An order's returns and the lines staff can still return. */
export default class AdminOrderReturnsTransformer extends BaseTransformer<StaffReturnsOverview> {
  toObject() {
    return {
      returnableLines: this.resource.returnableLines.map((line) => ({
        lineItemId: line.lineItemId,
        productTitle: line.productTitle,
        variantTitle: line.variantTitle,
        quantity: line.quantity,
      })),
      returns: ReturnTransformer.transform(this.resource.returns),
    }
  }
}
