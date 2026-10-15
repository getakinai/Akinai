import { inject } from '@adonisjs/core'
import type { Infer } from '@vinejs/vine/types'
import OptionDefinition from '#models/option_definition'
import OptionDefinitionRepository from '#repositories/option_definition_repository'
import AuditLogService from '#services/audit_log_service'
import BaseCsvTransferService, { type CsvRowReporter } from '#services/base_csv_transfer_service'
import {
  adminOptionImportRowValidator,
  MAX_OPTION_CSV_VALUES,
  MAX_OPTION_VALUE_LENGTH,
  OPTION_CSV_VALUE_SEPARATOR,
} from '#validators/admin_option_import_row_validator'
import type { adminOptionsExportQueryValidator } from '#validators/admin_options_export_query_validator'

export const OPTION_CSV_COLUMNS = ['name', 'values', 'status'] as const

type Column = (typeof OPTION_CSV_COLUMNS)[number]
type Row = Infer<typeof adminOptionImportRowValidator>
type CreateData = { name: string; isActive: boolean; values: string[] }
type Filters = Infer<typeof adminOptionsExportQueryValidator>

/**
 * Catalog options as CSV, one row per option with its values joined by
 * `|` in order. The name is the unique key.
 */
@inject()
export default class OptionCsvService extends BaseCsvTransferService<
  Column,
  Row,
  CreateData,
  OptionDefinition,
  Filters
> {
  protected readonly columns = OPTION_CSV_COLUMNS
  protected readonly noun = ['option', 'options'] as const
  protected readonly keyColumn = 'name' as const
  protected readonly lowercaseColumns = ['status'] as const
  protected readonly Model = OptionDefinition
  protected readonly exportEvent = 'options_exported' as const

  constructor(
    auditLogService: AuditLogService,
    protected optionDefinitionRepository: OptionDefinitionRepository
  ) {
    super(auditLogService)
  }

  protected async sampleRows(suffix: string) {
    return [
      { name: `Size ${suffix}`, values: 'S|M|L|XL', status: 'active' },
      { name: `Color ${suffix}`, values: 'Black|White|Navy', status: 'active' },
    ]
  }

  protected validateRow(cells: Record<string, string>) {
    return adminOptionImportRowValidator.validate(cells)
  }

  protected keyOf(row: Row) {
    return row.name
  }

  protected existingKeys(keys: string[]) {
    return this.optionDefinitionRepository.namesIn(keys)
  }

  protected fetchForExport(filters: Filters, limit: number) {
    return this.optionDefinitionRepository.exportRows(
      {
        q: filters.q || undefined,
        status: filters.status,
        sort: filters.sort ?? 'name',
        direction: filters.direction ?? 'asc',
      },
      limit
    )
  }

  protected toCsvRow(definition: OptionDefinition) {
    return {
      name: definition.name,
      values: definition.values.map(({ value }) => value).join(OPTION_CSV_VALUE_SEPARATOR),
      status: definition.isActive ? 'active' : 'archived',
    }
  }

  protected build(row: Row, report: CsvRowReporter): CreateData {
    const values = (row.values ?? '')
      .split(OPTION_CSV_VALUE_SEPARATOR)
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    const seen = new Set<string>()
    const repeated = values.find((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return true
      seen.add(key)
      return false
    })

    if (repeated) report('values', `The value "${repeated}" is listed more than once.`)
    if (values.length > MAX_OPTION_CSV_VALUES) {
      report('values', `An option can have at most ${MAX_OPTION_CSV_VALUES} values.`)
    }
    if (values.some((value) => value.length > MAX_OPTION_VALUE_LENGTH)) {
      report('values', `Each value can be at most ${MAX_OPTION_VALUE_LENGTH} characters.`)
    }
    return { name: row.name, isActive: row.status !== 'archived', values }
  }

  protected createMany(data: CreateData[]) {
    return this.optionDefinitionRepository.createManyWithValues(data)
  }
}
