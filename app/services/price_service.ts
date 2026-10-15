import { inject } from '@adonisjs/core'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import PriceRepository, {
  type MarketPrice,
  type VariantMarketPriceData,
} from '#repositories/price_repository'
import MarketRepository from '#repositories/market_repository'

export type VariantPrice = MarketPrice & { variantId: string }

/**
 * Variant and shipping prices per market. Each non-primary market has its
 * own manually entered prices; nothing is converted.
 */
@inject()
export default class PriceService {
  constructor(
    protected priceRepository: PriceRepository,
    protected marketRepository: MarketRepository
  ) {}

  /**
   * Active non-primary markets, the ones staff enter their own prices for.
   */
  async pricingMarkets() {
    return this.marketRepository.listActiveSecondary()
  }

  /**
   * The primary market (base prices) followed by the pricing markets.
   */
  async pricingMarketsWithPrimary() {
    const [primary, secondary] = await Promise.all([
      this.marketRepository.findPrimary(),
      this.pricingMarkets(),
    ])
    return primary ? [primary, ...secondary] : secondary
  }

  async forMarket(variantIds: string[], market: PriceMarket): Promise<Map<string, MarketPrice>> {
    return this.priceRepository.forMarket(variantIds, market)
  }

  /**
   * Current prices of the cart's variants in the market. Variants without a
   * price there are left out, so the cart can drop them.
   */
  async cartPrices(variantIds: string[], market: PriceMarket): Promise<VariantPrice[]> {
    const prices = await this.priceRepository.forMarket(variantIds, market)
    return variantIds.flatMap((variantId) => {
      const price = prices.get(variantId)
      return price ? [{ variantId, ...price }] : []
    })
  }

  /**
   * Replaces the variants' prices in every active non-primary market.
   * Markets missing from `prices` lose their price row (the variants become
   * unavailable there). Prices for the primary or unknown markets are
   * ignored.
   */
  async syncVariantMarketPrices(variantIds: string[], prices: VariantMarketPriceData[]) {
    const markets = await this.pricingMarkets()
    const marketIds = markets.map(({ id }) => id)
    const allowed = new Set(marketIds)
    await this.priceRepository.syncVariantMarketPrices(
      variantIds,
      marketIds,
      prices.filter(({ marketId }) => allowed.has(marketId))
    )
  }
}
