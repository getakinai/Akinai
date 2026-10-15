import { BaseTransformer } from '@adonisjs/core/transformers'
import type { CustomerReturnsOverview } from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'

/** What the customer can return from an order, and their returns so far. */
export default class CustomerOrderReturnsTransformer extends BaseTransformer<CustomerReturnsOverview> {
  toObject() {
    return {
      returnWindowEndsAt: this.resource.returnWindowEndsAt?.toISO() ?? null,
      returnableLines: this.resource.returnableLines.map((line) => ({
        lineItemId: line.lineItemId,
        productTitle: line.productTitle,
        variantTitle: line.variantTitle,
        quantity: line.quantity,
        windowEndsAt: line.windowEndsAt?.toISO() ?? null,
      })),
      returns: ReturnTransformer.transform(this.resource.returns).useVariant('toCustomer'),
    }
  }
}
