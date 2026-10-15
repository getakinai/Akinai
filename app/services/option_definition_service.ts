import { inject } from '@adonisjs/core'
import OptionDefinition from '#models/option_definition'
import type OptionDefinitionValue from '#models/option_definition_value'
import ProductOption from '#models/product_option'
import ProductOptionValue from '#models/product_option_value'
import ProductVariant from '#models/product_variant'
import OptionDefinitionRepository, {
  type PaginateOptionDefinitionsData,
  type SyncedProductCopies,
} from '#repositories/option_definition_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListOptionDefinitionsFilters = Partial<PaginateOptionDefinitionsData>

const IN_USE_TITLES_SHOWN = 3

@inject()
export default class OptionDefinitionService {
  constructor(
    protected optionDefinitionRepository: OptionDefinitionRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListOptionDefinitionsFilters = {}) {
    return this.optionDefinitionRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'name',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async catalog() {
    return this.optionDefinitionRepository.allActiveWithValues()
  }

  async findOrFail(id: string) {
    return this.optionDefinitionRepository.findOrFail(id)
  }

  async findDetailOrFail(id: string) {
    return this.optionDefinitionRepository.findWithValuesOrFail(id)
  }

  async create(name: string) {
    return this.optionDefinitionRepository.create(name.trim())
  }

  /**
   * Renames the option and updates the copies products keep of it (option
   * names, values, variant titles). Saving with the same name still repairs
   * stale copies.
   */
  async update(definition: OptionDefinition, name: string) {
    const { definition: updated, synced } =
      await this.optionDefinitionRepository.updateAndSyncProducts(definition, name.trim())
    await this.recordSyncedProductCopies(synced)
    return updated
  }

  async archive(definition: OptionDefinition) {
    return this.optionDefinitionRepository.setActive(definition, false)
  }

  async unarchive(definition: OptionDefinition) {
    return this.optionDefinitionRepository.setActive(definition, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.optionDefinitionRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(OptionDefinition, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }

  async addValue(definitionId: string, value: string) {
    return this.optionDefinitionRepository.addValue(definitionId, value.trim())
  }

  async updateValue(entry: OptionDefinitionValue, value: string) {
    const { entry: updated, synced } =
      await this.optionDefinitionRepository.updateValueAndSyncProducts(entry, value.trim())
    await this.recordSyncedProductCopies(synced)
    return updated
  }

  protected async recordSyncedProductCopies({ options, values, variants }: SyncedProductCopies) {
    await Promise.all([
      this.auditLogService.recordBulkChanges(ProductOption, options),
      this.auditLogService.recordBulkChanges(ProductOptionValue, values),
      this.auditLogService.recordBulkChanges(ProductVariant, variants),
    ])
  }

  async deleteValue(entry: OptionDefinitionValue) {
    await this.optionDefinitionRepository.deleteValue(entry)
  }

  async findValueForDefinitionOrFail(definitionId: string, valueId: string) {
    return this.optionDefinitionRepository.findValueForDefinitionOrFail(definitionId, valueId)
  }

  /**
   * Why the option cannot be archived, naming the products that use it, or
   * null when no product does.
   */
  async archiveBlockedReason(definitionId: string): Promise<string | null> {
    const { titles, total } = await this.optionDefinitionRepository.productsUsingDefinition(
      definitionId,
      IN_USE_TITLES_SHOWN
    )
    if (total === 0) return null

    const quoted = titles.map((title) => `“${title}”`)
    const more = total - titles.length
    const names =
      more > 0
        ? `${quoted.join(', ')} and ${more} more ${more === 1 ? 'product' : 'products'}`
        : quoted.length === 1
          ? quoted[0]
          : `${quoted.slice(0, -1).join(', ')} and ${quoted.at(-1)}`
    const pronoun = total === 1 ? 'that product' : 'those products'
    return `This option is used by ${names}. Remove it from ${pronoun} before archiving it.`
  }

  isValueInUse(valueId: string) {
    return this.optionDefinitionRepository.isValueInUse(valueId)
  }

  resolveCatalogOptions(
    selections: { optionDefinitionId: string; optionDefinitionValueIds: string[] }[]
  ) {
    return this.optionDefinitionRepository.loadCatalogInputs(selections)
  }
}
