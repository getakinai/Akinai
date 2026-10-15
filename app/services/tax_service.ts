import { inject } from '@adonisjs/core'
import TaxRate from '#models/tax_rate'
import TaxRateRepository, {
  type PaginateTaxRatesData,
  type TaxRateData,
} from '#repositories/tax_rate_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListTaxRatesFilters = Partial<PaginateTaxRatesData>

@inject()
export default class TaxService {
  constructor(
    protected taxRateRepository: TaxRateRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListTaxRatesFilters = {}) {
    return this.taxRateRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'countryCode',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async findOrFail(id: string): Promise<TaxRate> {
    return this.taxRateRepository.findOrFail(id)
  }

  async create(data: TaxRateData): Promise<TaxRate> {
    return this.taxRateRepository.create(normalize(data))
  }

  async update(taxRate: TaxRate, data: TaxRateData): Promise<TaxRate> {
    return this.taxRateRepository.update(taxRate, normalize(data))
  }

  /**
   * Creates the rate unless its country/region slot is already taken.
   */
  async ensureRate(data: TaxRateData): Promise<TaxRate> {
    const normalized = normalize(data)
    const existing = await this.taxRateRepository.findFor(
      normalized.countryCode,
      normalized.regionCode
    )
    return existing ?? this.taxRateRepository.create(normalized)
  }

  async archive(taxRate: TaxRate): Promise<TaxRate> {
    return this.taxRateRepository.setActive(taxRate, false)
  }

  async unarchive(taxRate: TaxRate): Promise<TaxRate> {
    return this.taxRateRepository.setActive(taxRate, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.taxRateRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(TaxRate, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }

  /**
   * The active rate for the region, falling back to the country-wide rate.
   */
  async resolve(countryCode: string, regionCode?: string | null): Promise<TaxRate | null> {
    const country = countryCode.toUpperCase()
    const region = regionCode?.trim().toUpperCase() || null

    if (region) {
      const regional = await this.taxRateRepository.findActive(country, region)
      if (regional) return regional
    }
    return this.taxRateRepository.findActive(country, null)
  }
}

function normalize(data: TaxRateData): TaxRateData {
  return {
    ...data,
    countryCode: data.countryCode.toUpperCase(),
    regionCode: data.regionCode?.toUpperCase() || null,
  }
}
