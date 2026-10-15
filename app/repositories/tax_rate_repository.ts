import TaxRate from '#models/tax_rate'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type TaxRateData = {
  name: string
  countryCode: string
  regionCode: string | null
  rate: number
  appliesToShipping: boolean
}

export type TaxRateSortKey = 'name' | 'countryCode' | 'rate' | 'createdAt'

export type TaxRateStatusFilter = 'active' | 'archived'

export type PaginateTaxRatesData = {
  q?: string
  status?: TaxRateStatusFilter
  sort: TaxRateSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<TaxRateSortKey, string> = {
  name: 'name',
  countryCode: 'country_code',
  rate: 'rate',
  createdAt: 'created_at',
}

export default class TaxRateRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateTaxRatesData) {
    return TaxRate.query()
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('name', containsPattern(q))
            .orWhereILike('country_code', containsPattern(q))
            .orWhereILike('region_code', containsPattern(q))
        })
      })
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<TaxRate> {
    return TaxRate.findOrFail(id)
  }

  async findActive(countryCode: string, regionCode: string | null): Promise<TaxRate | null> {
    return this.findFor(countryCode, regionCode, true)
  }

  /**
   * The rate for the country/region slot, archived or not.
   */
  async findFor(
    countryCode: string,
    regionCode: string | null,
    activeOnly = false
  ): Promise<TaxRate | null> {
    return TaxRate.query()
      .if(activeOnly, (query) => query.where('is_active', true))
      .where('country_code', countryCode)
      .if(
        regionCode,
        (query) => query.where('region_code', regionCode!),
        (query) => query.whereNull('region_code')
      )
      .first()
  }

  async create(data: TaxRateData): Promise<TaxRate> {
    return TaxRate.create({ isActive: true, ...data })
  }

  async update(taxRate: TaxRate, data: TaxRateData): Promise<TaxRate> {
    return taxRate.merge(data).save()
  }

  async setActive(taxRate: TaxRate, isActive: boolean): Promise<TaxRate> {
    return taxRate.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the tax rates in `ids`, skipping
   * ones already in that state. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<TaxRate[]> {
    return bulkUpdate(TaxRate, ids, { isActive }, (query) => query.where('is_active', !isActive))
  }
}
