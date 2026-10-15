import type { DraftOrderQuote } from '#services/draft_order_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Live totals for the draft order form. Nothing here is saved.
 */
export default class DraftOrderQuoteTransformer extends BaseTransformer<DraftOrderQuote> {
  toObject() {
    const {
      data,
      lines,
      market,
      discount,
      shippingDiscount,
      taxRate,
      shippingRates,
      taxCalculated,
    } = this.resource
    return {
      lineItems: lines.map((line) => ({
        productVariantId: line.productVariantId,
        productTitle: line.productTitle,
        variantTitle: line.variantTitle,
        sku: line.sku,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      market: {
        id: market.id,
        name: market.name,
        currencyCode: market.currencyCode,
        pricesIncludeTax: market.pricesIncludeTax,
      },
      discount: discount ? { id: discount.id, code: discount.code, title: discount.title } : null,
      shippingDiscount: shippingDiscount
        ? { id: shippingDiscount.id, code: shippingDiscount.code, title: shippingDiscount.title }
        : null,
      tax: taxRate
        ? { name: taxRate.name, rate: taxRate.rate, appliesToShipping: taxRate.appliesToShipping }
        : null,
      taxCalculated,
      shippingRateId: data.shippingRateId,
      shippingRates: shippingRates.map((rate) => ({
        id: rate.id,
        name: rate.name,
        price: rate.price,
      })),
      subtotal: data.subtotal,
      discountTotal: data.discountTotal,
      shippingDiscountTotal: data.shippingDiscountTotal,
      shippingTotal: data.shippingTotal,
      taxTotal: data.taxTotal,
      total: data.total,
    }
  }
}
