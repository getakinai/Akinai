import type { DraftOrderQuote } from '#services/draft_order_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Live totals and shipping choices for the storefront checkout.
 */
export default class CheckoutQuoteTransformer extends BaseTransformer<DraftOrderQuote> {
  toObject() {
    const { data, lines, taxRate, shippingRates, taxCalculated } = this.resource
    return {
      lineItems: lines.map((line) => ({
        variantId: line.productVariantId,
        productTitle: line.productTitle,
        variantTitle: line.variantTitle,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        discountAllocation: line.discountAllocation,
      })),
      currencyCode: data.currencyCode,
      pricesIncludeTax: data.pricesIncludeTax,
      taxName: taxRate?.name ?? null,
      taxCalculated,
      shippingRateId: data.shippingRateId,
      shippingRates: shippingRates.map((rate) => ({
        id: rate.id,
        name: rate.name,
        description: rate.description,
        price: rate.price,
      })),
      discountCode: data.discountCode,
      discountTitle: data.discountTitle,
      shippingDiscountCode: data.shippingDiscountCode,
      shippingDiscountTitle: data.shippingDiscountTitle,
      subtotal: data.subtotal,
      discountTotal: data.discountTotal,
      shippingDiscountTotal: data.shippingDiscountTotal,
      shippingTotal: data.shippingTotal,
      taxTotal: data.taxTotal,
      total: data.total,
    }
  }
}
