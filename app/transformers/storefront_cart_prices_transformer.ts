import { BaseTransformer } from '@adonisjs/core/transformers'
import type { VariantPrice } from '#services/price_service'

export type StorefrontCartPrices = { market: string; prices: VariantPrice[] }

/**
 * Cart variant prices in the shopper's market (`market` is its handle).
 * Variants missing from `prices` can't be bought in that market.
 */
export default class StorefrontCartPricesTransformer extends BaseTransformer<StorefrontCartPrices> {
  toObject() {
    return {
      market: this.resource.market,
      prices: this.resource.prices.map(({ variantId, price, compareAtPrice }) => ({
        variantId,
        price,
        compareAtPrice: compareAtPrice !== null && compareAtPrice > price ? compareAtPrice : null,
      })),
    }
  }
}
