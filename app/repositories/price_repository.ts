import db from '@adonisjs/lucid/services/db'
import { v7 as uuidv7 } from 'uuid'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ProductVariant from '#models/product_variant'
import ProductVariantPrice from '#models/product_variant_price'
import ShippingRatePrice from '#models/shipping_rate_price'
import type { PriceMarket } from '#repositories/helpers/market_prices'

export type MarketPrice = { price: number; compareAtPrice: number | null }

export type ShippingRateMarketPrice = {
  price: number
  minSubtotal: number | null
  maxSubtotal: number | null
}

export type ShippingRateMarketPriceData = {
  marketId: string
  price: number
  minSubtotal?: number | null
  maxSubtotal?: number | null
}

export type VariantMarketPriceData = {
  marketId: string
  price: number
  compareAtPrice: number | null
}

/**
 * Prices in a market. The primary market reads the variant's or rate's own
 * price; other markets read their price rows, and ids without a row are
 * left out of the result (not sellable / not offered in that market).
 */
export default class PriceRepository {
  async forMarket(variantIds: string[], market: PriceMarket): Promise<Map<string, MarketPrice>> {
    if (variantIds.length === 0) return new Map()

    if (market.isPrimary) {
      const variants = await ProductVariant.query()
        .select('id', 'price', 'compare_at_price')
        .whereIn('id', variantIds)
      return new Map(
        variants.map(({ id, price, compareAtPrice }) => [id, { price, compareAtPrice }])
      )
    }

    const rows = await ProductVariantPrice.query()
      .select('product_variant_id', 'price', 'compare_at_price')
      .where('market_id', market.id)
      .whereIn('product_variant_id', variantIds)
    return new Map(
      rows.map(({ productVariantId, price, compareAtPrice }) => [
        productVariantId,
        { price, compareAtPrice },
      ])
    )
  }

  /**
   * Shipping rate prices in a non-primary market, by rate id.
   */
  async shippingRatePrices(
    rateIds: string[],
    marketId: string
  ): Promise<Map<string, ShippingRateMarketPrice>> {
    if (rateIds.length === 0) return new Map()
    const rows = await ShippingRatePrice.query()
      .select('shipping_rate_id', 'price', 'min_subtotal', 'max_subtotal')
      .where('market_id', marketId)
      .whereIn('shipping_rate_id', rateIds)
    return new Map(
      rows.map(({ shippingRateId, price, minSubtotal, maxSubtotal }) => [
        shippingRateId,
        { price, minSubtotal, maxSubtotal },
      ])
    )
  }

  /**
   * Market price rows of the shipping rates, for the admin zone page.
   */
  async shippingRateMarketPrices(rateIds: string[]): Promise<ShippingRatePrice[]> {
    if (rateIds.length === 0) return []
    return ShippingRatePrice.query().whereIn('shipping_rate_id', rateIds)
  }

  /**
   * Market price rows of the variants, for the admin product page.
   */
  async variantMarketPrices(variantIds: string[]): Promise<ProductVariantPrice[]> {
    if (variantIds.length === 0) return []
    return ProductVariantPrice.query()
      .whereIn('product_variant_id', variantIds)
      .orderBy('market_id', 'asc')
  }

  /**
   * Sets the variants' prices in the given markets in one statement each:
   * one multi-row upsert for the prices sent, one delete for markets left
   * out of `prices` among `marketIds`.
   */
  async syncVariantMarketPrices(
    variantIds: string[],
    marketIds: string[],
    prices: VariantMarketPriceData[],
    trx?: TransactionClientContract
  ): Promise<void> {
    if (variantIds.length === 0 || marketIds.length === 0) return
    const client = trx ?? db
    const keep = new Set(prices.map(({ marketId }) => marketId))
    const remove = marketIds.filter((id) => !keep.has(id))
    const now = new Date()

    if (remove.length > 0) {
      await client
        .from('product_variant_prices')
        .whereIn('product_variant_id', variantIds)
        .whereIn('market_id', remove)
        .delete()
    }
    if (prices.length === 0) return

    const rows = variantIds.flatMap((productVariantId) =>
      prices.map(({ marketId, price, compareAtPrice }) => ({
        id: uuidv7(),
        product_variant_id: productVariantId,
        market_id: marketId,
        price,
        compare_at_price: compareAtPrice,
        created_at: now,
        updated_at: now,
      }))
    )
    await client
      .knexQuery()
      .table('product_variant_prices')
      .insert(rows)
      .onConflict(['product_variant_id', 'market_id'])
      .merge(['price', 'compare_at_price', 'updated_at'])
  }

  /**
   * Sets a shipping rate's prices in the given markets, like
   * `syncVariantMarketPrices`.
   */
  async syncShippingRateMarketPrices(
    rateId: string,
    marketIds: string[],
    prices: ShippingRateMarketPriceData[]
  ): Promise<void> {
    if (marketIds.length === 0) return
    const keep = new Set(prices.map(({ marketId }) => marketId))
    const remove = marketIds.filter((id) => !keep.has(id))
    const now = new Date()

    if (remove.length > 0) {
      await db
        .from('shipping_rate_prices')
        .where('shipping_rate_id', rateId)
        .whereIn('market_id', remove)
        .delete()
    }
    if (prices.length === 0) return

    await db
      .knexQuery()
      .table('shipping_rate_prices')
      .insert(
        prices.map(({ marketId, price, minSubtotal, maxSubtotal }) => ({
          id: uuidv7(),
          shipping_rate_id: rateId,
          market_id: marketId,
          price,
          min_subtotal: minSubtotal ?? null,
          max_subtotal: maxSubtotal ?? null,
          created_at: now,
          updated_at: now,
        }))
      )
      .onConflict(['shipping_rate_id', 'market_id'])
      .merge(['price', 'min_subtotal', 'max_subtotal', 'updated_at'])
  }
}
