import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Market from '#models/market'
import MarketCountry from '#models/market_country'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type MarketData = {
  name: string
  handle: string
  currencyCode: string
  pricesIncludeTax: boolean
}

export type CreateMarketData = MarketData & {
  isPrimary?: boolean
  isActive?: boolean
}

export type MarketSortKey = 'name' | 'createdAt'

export type MarketStatusFilter = 'active' | 'archived'

export type PaginateMarketsData = {
  q?: string
  status?: MarketStatusFilter
  sort: MarketSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<MarketSortKey, string> = {
  name: 'name',
  createdAt: 'created_at',
}

export default class MarketRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateMarketsData) {
    return Market.query()
      .withCount('countries', (query) => query.as('countries_count'))
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('name', containsPattern(q))
            .orWhereILike('handle', containsPattern(q))
            .orWhereILike('currency_code', containsPattern(q))
        })
      })
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy('is_primary', 'desc')
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<Market> {
    return Market.findOrFail(id)
  }

  async findWithCountriesOrFail(id: string): Promise<Market> {
    return Market.query()
      .where('id', id)
      .preload('countries', (query) => query.orderBy('country_code', 'asc'))
      .firstOrFail()
  }

  async findByHandle(handle: string): Promise<Market | null> {
    return Market.findBy('handle', handle)
  }

  async findPrimary(): Promise<Market | null> {
    return Market.findBy('is_primary', true)
  }

  async findActiveWithCountries(where: { id?: string; handle?: string }): Promise<Market | null> {
    return Market.query()
      .where('is_active', true)
      .if(where.id, (query) => query.where('id', where.id!))
      .if(where.handle, (query) => query.where('handle', where.handle!))
      .preload('countries', (query) => query.orderBy('country_code', 'asc'))
      .first()
  }

  async findActiveOrFail(id: string): Promise<Market> {
    return Market.query().where('id', id).where('is_active', true).firstOrFail()
  }

  async findPrimaryWithCountries(): Promise<Market | null> {
    return Market.query()
      .where('is_primary', true)
      .preload('countries', (query) => query.orderBy('country_code', 'asc'))
      .first()
  }

  /**
   * Active markets with their countries, primary first.
   */
  async listActiveWithCountries(): Promise<Market[]> {
    return Market.query()
      .where('is_active', true)
      .preload('countries', (query) => query.orderBy('country_code', 'asc'))
      .orderBy('is_primary', 'desc')
      .orderBy('name', 'asc')
  }

  /**
   * Active markets other than the primary one, which use their own prices.
   */
  async listActiveSecondary(): Promise<Market[]> {
    return Market.query().where('is_active', true).where('is_primary', false).orderBy('name', 'asc')
  }

  /**
   * The market (active or archived) that covers any of the countries.
   */
  async findForAnyCountry(countryCodes: string[]): Promise<Market | null> {
    return Market.query()
      .whereHas('countries', (query) => query.whereIn('country_code', countryCodes))
      .first()
  }

  /**
   * Every country covered by an active market.
   */
  async listActiveCountryCodes(): Promise<string[]> {
    const rows: { country_code: string }[] = await db
      .from('market_countries')
      .join('markets', 'markets.id', 'market_countries.market_id')
      .where('markets.is_active', true)
      .select('market_countries.country_code')
    return rows.map(({ country_code: code }) => code)
  }

  async findActiveForCountry(countryCode: string): Promise<Market | null> {
    return Market.query()
      .where('is_active', true)
      .whereHas('countries', (query) => query.where('country_code', countryCode))
      .first()
  }

  async create(data: CreateMarketData, countryCodes: string[]): Promise<Market> {
    return db.transaction(async (trx) => {
      const market = await Market.create(
        { isPrimary: false, isActive: true, ...data },
        { client: trx }
      )
      await this.writeCountries(market.id, countryCodes, trx)
      return market
    })
  }

  /**
   * Saves the market and replaces its countries in one transaction.
   */
  async update(market: Market, data: MarketData, countryCodes: string[]): Promise<Market> {
    return db.transaction(async (trx) => {
      market.useTransaction(trx)
      await market.merge(data).save()
      await MarketCountry.query({ client: trx }).where('market_id', market.id).delete()
      await this.writeCountries(market.id, countryCodes, trx)
      return market
    })
  }

  async setActive(market: Market, isActive: boolean): Promise<Market> {
    return market.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the markets in `ids`, skipping
   * ones already in that state. The primary market is never archived.
   * Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<Market[]> {
    return bulkUpdate(Market, ids, { isActive }, (query) =>
      query
        .where('is_active', !isActive)
        .if(!isActive, (scoped) => scoped.where('is_primary', false))
    )
  }

  protected async writeCountries(
    marketId: string,
    countryCodes: string[],
    trx: TransactionClientContract
  ) {
    if (countryCodes.length === 0) return
    await MarketCountry.createMany(
      countryCodes.map((countryCode) => ({ marketId, countryCode })),
      { client: trx }
    )
  }
}
