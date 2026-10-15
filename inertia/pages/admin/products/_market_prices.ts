import { type PricingMarket } from '../_types'
import { type AdminVariant } from './_types'

export const PRODUCT_PRICING_MARKETS_URL = '/admin/products/markets'

export type MarketPriceDraft = Record<
  string,
  { price: number | null; compareAtPrice: number | null }
>

export function marketPriceDraft(prices: AdminVariant['marketPrices'] = []): MarketPriceDraft {
  return Object.fromEntries(
    prices.map(({ marketId, price, compareAtPrice }) => [marketId, { price, compareAtPrice }])
  )
}

/**
 * Markets with a value entered, in market order. A market with only a
 * compare-at price is kept (with a null price) so validation can flag it.
 */
export function marketPriceEntries(markets: PricingMarket[], draft: MarketPriceDraft) {
  return markets.flatMap(({ id }) => {
    const entry = draft[id]
    if (!entry || (entry.price === null && entry.compareAtPrice === null)) return []
    return [{ marketId: id, price: entry.price, compareAtPrice: entry.compareAtPrice }]
  })
}

/**
 * Error key prefix for the market's entry, matching the index it has in
 * `marketPriceEntries`. Null when the market has no entry.
 */
export function marketPriceErrorPath(
  markets: PricingMarket[],
  draft: MarketPriceDraft,
  marketId: string
): string | null {
  const index = marketPriceEntries(markets, draft).findIndex((entry) => entry.marketId === marketId)
  return index === -1 ? null : `marketPrices.${index}`
}

export function sameMarketPrices(
  a: MarketPriceDraft,
  b: MarketPriceDraft,
  markets: PricingMarket[]
) {
  return markets.every(({ id }) => {
    const left = a[id] ?? { price: null, compareAtPrice: null }
    const right = b[id] ?? { price: null, compareAtPrice: null }
    return left.price === right.price && left.compareAtPrice === right.compareAtPrice
  })
}
