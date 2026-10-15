import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { regionCountryCode } from '#constants/country_regions'
import ShippingRate from '#models/shipping_rate'
import ShippingZone from '#models/shipping_zone'
import ShippingZoneCountry from '#models/shipping_zone_country'
import ShippingZoneRegion from '#models/shipping_zone_region'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type ShippingZoneData = {
  name: string
}

export type ShippingRateData = {
  name: string
  description?: string | null
  price: number
  minSubtotal: number | null
  maxSubtotal: number | null
  minWeight?: number | null
  maxWeight?: number | null
  minItems?: number | null
  maxItems?: number | null
  isActive: boolean
}

export type ShippingZoneSortKey = 'name' | 'createdAt'

export type ShippingZoneStatusFilter = 'active' | 'archived'

export type PaginateShippingZonesData = {
  q?: string
  status?: ShippingZoneStatusFilter
  sort: ShippingZoneSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

/** Where the zone ships. `regionCodes` left out keeps the saved regions. */
export type ShippingZoneDestinations = {
  countryCodes: string[]
  regionCodes?: string[]
}

const sortColumns: Record<ShippingZoneSortKey, string> = {
  name: 'name',
  createdAt: 'created_at',
}

export default class ShippingZoneRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateShippingZonesData) {
    return ShippingZone.query()
      .withCount('countries', (query) => query.as('countries_count'))
      .withCount('regions', (query) => query.as('regions_count'))
      .withCount('rates', (query) => query.as('rates_count'))
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<ShippingZone> {
    return ShippingZone.findOrFail(id)
  }

  async findByName(name: string): Promise<ShippingZone | null> {
    return ShippingZone.query().whereILike('name', name).first()
  }

  async findDetailOrFail(id: string): Promise<ShippingZone> {
    return ShippingZone.query()
      .where('id', id)
      .preload('countries', (query) => query.orderBy('country_code', 'asc'))
      .preload('regions', (query) => query.orderBy('region_code', 'asc'))
      .preload('rates', (query) =>
        query.orderBy('price', 'asc').orderBy('name', 'asc').preload('marketPrices')
      )
      .firstOrFail()
  }

  /**
   * Every region assigned to a zone, with the zone's id and name, for the
   * admin region picker.
   */
  async listRegions(): Promise<ShippingZoneRegion[]> {
    return ShippingZoneRegion.query()
      .preload('zone', (query) => query.select('id', 'name'))
      .orderBy('region_code', 'asc')
  }

  async create(data: ShippingZoneData, destinations: ShippingZoneDestinations) {
    return db.transaction(async (trx) => {
      const zone = await ShippingZone.create({ isActive: true, ...data }, { client: trx })
      await this.writeCountries(zone.id, destinations.countryCodes, trx)
      await this.writeRegions(zone.id, destinations.regionCodes ?? [], trx)
      return zone
    })
  }

  /**
   * Saves the zone and replaces its destinations in one transaction.
   */
  async update(
    zone: ShippingZone,
    data: ShippingZoneData,
    destinations: ShippingZoneDestinations
  ): Promise<ShippingZone> {
    return db.transaction(async (trx) => {
      zone.useTransaction(trx)
      await zone.merge(data).save()
      await ShippingZoneCountry.query({ client: trx }).where('shipping_zone_id', zone.id).delete()
      await this.writeCountries(zone.id, destinations.countryCodes, trx)
      if (destinations.regionCodes) {
        await ShippingZoneRegion.query({ client: trx }).where('shipping_zone_id', zone.id).delete()
        await this.writeRegions(zone.id, destinations.regionCodes, trx)
      }
      return zone
    })
  }

  async setActive(zone: ShippingZone, isActive: boolean): Promise<ShippingZone> {
    return zone.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the shipping zones in `ids`, skipping
   * ones already in that state. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<ShippingZone[]> {
    return bulkUpdate(ShippingZone, ids, { isActive }, (query) =>
      query.where('is_active', !isActive)
    )
  }

  async findRateForZoneOrFail(zoneId: string, rateId: string): Promise<ShippingRate> {
    return ShippingRate.query().where('id', rateId).where('shipping_zone_id', zoneId).firstOrFail()
  }

  async createRate(zoneId: string, data: ShippingRateData): Promise<ShippingRate> {
    return ShippingRate.create({ shippingZoneId: zoneId, ...data })
  }

  async updateRate(rate: ShippingRate, data: ShippingRateData): Promise<ShippingRate> {
    return rate.merge(data).save()
  }

  async loadRateMarketPrices(rate: ShippingRate): Promise<ShippingRate> {
    await rate.load('marketPrices')
    return rate
  }

  async deleteRate(rate: ShippingRate): Promise<void> {
    await rate.delete()
  }

  /**
   * Active rates for the destination, cheapest first. An active zone
   * covering the region wins; otherwise the active zone covering the whole
   * country. Cart conditions (subtotal, weight, items) are checked by the
   * caller.
   */
  async activeRatesFor(countryCode: string, regionCode: string | null): Promise<ShippingRate[]> {
    if (regionCode) {
      const regionRates = await ShippingRate.query()
        .where('is_active', true)
        .whereHas('zone', (zone) => {
          zone
            .where('is_active', true)
            .whereHas('regions', (regions) => regions.where('region_code', regionCode))
        })
        .orderBy('price', 'asc')
        .orderBy('name', 'asc')
      if (regionRates.length > 0) return regionRates
    }

    return ShippingRate.query()
      .where('is_active', true)
      .whereHas('zone', (zone) => {
        zone
          .where('is_active', true)
          .whereHas('countries', (countries) => countries.where('country_code', countryCode))
      })
      .orderBy('price', 'asc')
      .orderBy('name', 'asc')
  }

  /**
   * Countries covered (wholly or through some regions) by an active zone
   * that has at least one active rate.
   */
  async activeCountryCodes(): Promise<string[]> {
    const [countries, regions] = await Promise.all([
      ShippingZoneCountry.query()
        .whereHas('zone', (zone) => {
          zone.where('is_active', true).whereHas('rates', (rates) => rates.where('is_active', true))
        })
        .distinct('country_code'),
      ShippingZoneRegion.query()
        .whereHas('zone', (zone) => {
          zone.where('is_active', true).whereHas('rates', (rates) => rates.where('is_active', true))
        })
        .distinct('country_code'),
    ])
    const codes = new Set([...countries, ...regions].map(({ countryCode }) => countryCode))
    return [...codes].sort()
  }

  protected async writeCountries(
    zoneId: string,
    countryCodes: string[],
    trx: TransactionClientContract
  ) {
    if (countryCodes.length === 0) return
    await ShippingZoneCountry.createMany(
      countryCodes.map((countryCode) => ({ shippingZoneId: zoneId, countryCode })),
      { client: trx }
    )
  }

  protected async writeRegions(
    zoneId: string,
    regionCodes: string[],
    trx: TransactionClientContract
  ) {
    if (regionCodes.length === 0) return
    await ShippingZoneRegion.createMany(
      regionCodes.map((regionCode) => ({
        shippingZoneId: zoneId,
        countryCode: regionCountryCode(regionCode),
        regionCode,
      })),
      { client: trx }
    )
  }
}
