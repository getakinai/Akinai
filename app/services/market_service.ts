import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import Market from '#models/market'
import MarketRepository, { type PaginateMarketsData } from '#repositories/market_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { orNullIfMissing } from '#utils/or_null_if_missing'

export type ListMarketsFilters = Partial<PaginateMarketsData>

export type CreateMarketInput = {
  name: string
  currencyCode: string
  pricesIncludeTax: boolean
  countryCodes: string[]
}

export type UpdateMarketInput = CreateMarketInput & {
  handle: string
}

/**
 * The country whose tax rate applies to the market (its first country).
 * Needs the `countries` preload; null otherwise.
 */
export function marketCountryCode(market: Market): string | null {
  const countries = market.$preloaded.countries as Market['countries'] | undefined
  return countries?.[0]?.countryCode ?? null
}

@inject()
export default class MarketService {
  constructor(
    protected marketRepository: MarketRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListMarketsFilters = {}) {
    return this.marketRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async findOrFail(id: string): Promise<Market> {
    return this.marketRepository.findOrFail(id)
  }

  async findDetailOrFail(id: string): Promise<Market> {
    return this.marketRepository.findWithCountriesOrFail(id)
  }

  /**
   * The active market with its countries preloaded, or null.
   */
  async findActiveWithCountries(id: string): Promise<Market | null> {
    return this.marketRepository.findActiveWithCountries({ id })
  }

  /**
   * The market an order is priced in: its saved market (archived or not),
   * else the primary market.
   */
  async findForOrder(marketId: string | null): Promise<Market | null> {
    if (marketId) {
      const market = await orNullIfMissing(this.marketRepository.findOrFail(marketId))
      if (market) return market
    }
    return this.marketRepository.findPrimary()
  }

  async create({ countryCodes, ...data }: CreateMarketInput): Promise<Market> {
    const market = await this.marketRepository.create(
      {
        ...data,
        currencyCode: data.currencyCode.toUpperCase(),
        handle: await this.uniqueHandle(data.name),
      },
      normalizeCountryCodes(countryCodes)
    )
    return this.marketRepository.findWithCountriesOrFail(market.id)
  }

  async update(market: Market, { countryCodes, ...data }: UpdateMarketInput): Promise<Market> {
    await this.marketRepository.update(
      market,
      { ...data, currencyCode: data.currencyCode.toUpperCase() },
      normalizeCountryCodes(countryCodes)
    )
    return this.marketRepository.findWithCountriesOrFail(market.id)
  }

  async archive(market: Market): Promise<Market> {
    return this.marketRepository.setActive(market, false)
  }

  async unarchive(market: Market): Promise<Market> {
    return this.marketRepository.setActive(market, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.marketRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(Market, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }

  /**
   * The active market that covers the country, or the primary market when
   * no active market lists it.
   */
  async findForCountry(countryCode: string): Promise<Market | null> {
    const market = await this.marketRepository.findActiveForCountry(countryCode.toUpperCase())
    return market ?? this.marketRepository.findPrimary()
  }

  async findPrimary(): Promise<Market | null> {
    return this.marketRepository.findPrimary()
  }

  /**
   * Creates the primary market when none exists yet.
   */
  async ensurePrimary(input: CreateMarketInput): Promise<Market> {
    const existing = await this.marketRepository.findPrimary()
    if (existing) {
      return existing
    }
    return this.marketRepository.create(
      {
        name: input.name,
        handle: await this.uniqueHandle(input.name),
        currencyCode: input.currencyCode.toUpperCase(),
        pricesIncludeTax: input.pricesIncludeTax,
        isPrimary: true,
      },
      normalizeCountryCodes(input.countryCodes)
    )
  }

  /**
   * Creates a non-primary market unless one already covers any of its
   * countries (archived markets count, so they aren't re-created).
   */
  async ensureMarket(input: CreateMarketInput): Promise<Market> {
    const existing = await this.marketRepository.findForAnyCountry(
      normalizeCountryCodes(input.countryCodes)
    )
    if (existing) return existing
    return this.create(input)
  }

  protected async uniqueHandle(name: string): Promise<string> {
    const base = string.slug(name, { lower: true, strict: true }) || 'market'
    let handle = base
    let suffix = 2

    while (await this.marketRepository.findByHandle(handle)) {
      handle = `${base}-${suffix++}`
    }
    return handle
  }
}

function normalizeCountryCodes(codes: string[]): string[] {
  return [...new Set(codes.map((code) => code.toUpperCase()))]
}
