import { inject } from '@adonisjs/core'
import type ShippingRate from '#models/shipping_rate'
import type ShippingRatePrice from '#models/shipping_rate_price'
import ShippingZone from '#models/shipping_zone'
import type ShippingZoneRegion from '#models/shipping_zone_region'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import MarketRepository from '#repositories/market_repository'
import PriceRepository, { type ShippingRateMarketPriceData } from '#repositories/price_repository'
import ShippingZoneRepository, {
  type PaginateShippingZonesData,
  type ShippingRateData,
} from '#repositories/shipping_zone_repository'
import AuditLogService from '#services/audit_log_service'
import {
  applyFreeShippingProducts,
  rateMatches,
  type CartShippingMetrics,
} from '#services/helpers/shipping_rate_rules'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListShippingZonesFilters = Partial<PaginateShippingZonesData>

export type RateMarketPriceInput = ShippingRateMarketPriceData

export type ShippingRateInput = ShippingRateData & {
  marketPrices?: RateMarketPriceInput[]
}

export type ShippingZoneInput = {
  name: string
  countryCodes: string[]
  /** Left out keeps the zone's saved regions. */
  regionCodes?: string[]
}

/** Where an order ships. `regionCode` is an ISO 3166-2 catalog code. */
export type ShippingDestination = {
  countryCode: string
  regionCode?: string | null
}

@inject()
export default class ShippingService {
  constructor(
    protected shippingZoneRepository: ShippingZoneRepository,
    protected auditLogService: AuditLogService,
    protected priceRepository: PriceRepository,
    protected marketRepository: MarketRepository
  ) {}

  async paginate(filters: ListShippingZonesFilters = {}) {
    return this.shippingZoneRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async findOrFail(id: string): Promise<ShippingZone> {
    return this.shippingZoneRepository.findOrFail(id)
  }

  async findDetailOrFail(id: string): Promise<ShippingZone> {
    return this.shippingZoneRepository.findDetailOrFail(id)
  }

  async create({ name, countryCodes, regionCodes }: ShippingZoneInput): Promise<ShippingZone> {
    const zone = await this.shippingZoneRepository.create(
      { name },
      normalizeDestinations(countryCodes, regionCodes)
    )
    return this.shippingZoneRepository.findDetailOrFail(zone.id)
  }

  async update(zone: ShippingZone, { name, countryCodes, regionCodes }: ShippingZoneInput) {
    await this.shippingZoneRepository.update(
      zone,
      { name },
      normalizeDestinations(countryCodes, regionCodes)
    )
    return this.shippingZoneRepository.findDetailOrFail(zone.id)
  }

  async listRegions(): Promise<ShippingZoneRegion[]> {
    return this.shippingZoneRepository.listRegions()
  }

  /** Countries active markets sell to; zones elsewhere can't take orders. */
  async marketCountryCodes(): Promise<string[]> {
    const markets = await this.marketRepository.listActiveWithCountries()
    const codes = new Set(markets.flatMap(({ countries }) => countries.map((c) => c.countryCode)))
    return [...codes].sort()
  }

  /**
   * Creates the zone with its rates unless a zone with the same name
   * exists.
   */
  async ensureZone(input: ShippingZoneInput, rates: ShippingRateData[]): Promise<ShippingZone> {
    const existing = await this.shippingZoneRepository.findByName(input.name)
    if (existing) return this.shippingZoneRepository.findDetailOrFail(existing.id)

    const zone = await this.create(input)
    for (const rate of rates) {
      await this.shippingZoneRepository.createRate(zone.id, rate)
    }
    return this.shippingZoneRepository.findDetailOrFail(zone.id)
  }

  async archive(zone: ShippingZone): Promise<ShippingZone> {
    return this.shippingZoneRepository.setActive(zone, false)
  }

  async unarchive(zone: ShippingZone): Promise<ShippingZone> {
    return this.shippingZoneRepository.setActive(zone, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.shippingZoneRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(ShippingZone, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }

  async findRateForZoneOrFail(zoneId: string, rateId: string): Promise<ShippingRate> {
    return this.shippingZoneRepository.findRateForZoneOrFail(zoneId, rateId)
  }

  /**
   * `marketPrices` (prices in non-primary markets) is optional; leaving it
   * out keeps the saved ones.
   */
  async createRate(zone: ShippingZone, input: ShippingRateInput): Promise<ShippingRate> {
    const { marketPrices, ...data } = input
    const rate = await this.shippingZoneRepository.createRate(zone.id, data)
    if (marketPrices) await this.syncRateMarketPrices(rate, marketPrices)
    return this.shippingZoneRepository.loadRateMarketPrices(rate)
  }

  async updateRate(rate: ShippingRate, input: ShippingRateInput): Promise<ShippingRate> {
    const { marketPrices, ...data } = input
    await this.shippingZoneRepository.updateRate(rate, data)
    if (marketPrices) await this.syncRateMarketPrices(rate, marketPrices)
    return this.shippingZoneRepository.loadRateMarketPrices(rate)
  }

  async deleteRate(rate: ShippingRate): Promise<void> {
    await this.shippingZoneRepository.deleteRate(rate)
  }

  async shippableCountryCodes(): Promise<string[]> {
    return this.shippingZoneRepository.activeCountryCodes()
  }

  /**
   * Rates a customer at the destination can choose for the cart, priced in
   * the market, cheapest first. A zone covering the destination's region
   * wins over one covering its whole country. Outside the primary market
   * each rate's `price`
   * is replaced with its market price and its subtotal bounds with that
   * market's bounds (the instances are never saved); rates without a market
   * price are left out. When every item ships free, the cheapest rate is 0.
   */
  async ratesFor(
    { countryCode, regionCode }: ShippingDestination,
    cart: CartShippingMetrics,
    market?: PriceMarket | null
  ): Promise<ShippingRate[]> {
    const rates = await this.shippingZoneRepository.activeRatesFor(
      countryCode.toUpperCase(),
      regionCode?.toUpperCase() || null
    )

    if (!market || market.isPrimary) {
      return applyFreeShippingProducts(
        rates.filter((rate) => rateMatches(rate, cart, rate)),
        cart
      )
    }

    const prices = await this.priceRepository.shippingRatePrices(
      rates.map(({ id }) => id),
      market.id
    )
    const offered = rates
      .flatMap((rate) => {
        const marketPrice = prices.get(rate.id)
        if (!marketPrice || !rateMatches(rate, cart, marketPrice)) return []
        rate.price = marketPrice.price
        rate.minSubtotal = marketPrice.minSubtotal
        rate.maxSubtotal = marketPrice.maxSubtotal
        return [rate]
      })
      .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
    return applyFreeShippingProducts(offered, cart)
  }

  async marketPricesForRates(rateIds: string[]): Promise<ShippingRatePrice[]> {
    return this.priceRepository.shippingRateMarketPrices(rateIds)
  }

  /**
   * Replaces the rate's prices in every active non-primary market. Markets
   * missing from `prices` stop offering the rate.
   */
  async syncRateMarketPrices(rate: ShippingRate, prices: RateMarketPriceInput[]) {
    const markets = await this.marketRepository.listActiveSecondary()
    const allowed = new Set(markets.map(({ id }) => id))
    await this.priceRepository.syncShippingRateMarketPrices(
      rate.id,
      [...allowed],
      prices.filter(({ marketId }) => allowed.has(marketId))
    )
  }
}

function normalizeDestinations(countryCodes: string[], regionCodes?: string[]) {
  const unique = (codes: string[]) => [...new Set(codes.map((code) => code.toUpperCase()))]
  return {
    countryCodes: unique(countryCodes),
    regionCodes: regionCodes && unique(regionCodes),
  }
}
