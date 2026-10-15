import type BaseAppModel from '#models/base/base_app_model'
import BaseCsvTransferService from '#services/base_csv_transfer_service'
import type { CsvActiveStatus } from '#validators/helpers/csv_import_fields'

export const NAMED_CSV_COLUMNS = ['name', 'status'] as const

export type NamedCsvColumn = (typeof NAMED_CSV_COLUMNS)[number]

export type NamedCsvRow = { name: string; status?: CsvActiveStatus }

export type NamedCsvData = { name: string; isActive: boolean }

type NamedEntity = BaseAppModel & { name: string; isActive: boolean }

type NamedFilters = {
  q?: string
  status?: CsvActiveStatus
  sort?: string
  direction?: 'asc' | 'desc'
}

/**
 * CSV import/export for catalog lists that are only a name plus an
 * archived flag (vendors, product types). The name is the unique key.
 */
export default abstract class BaseNamedCsvService<
  Entity extends NamedEntity,
  Filters extends NamedFilters,
> extends BaseCsvTransferService<NamedCsvColumn, NamedCsvRow, NamedCsvData, Entity, Filters> {
  protected readonly columns = NAMED_CSV_COLUMNS
  protected readonly keyColumn = 'name' as const
  protected readonly lowercaseColumns = ['status'] as const
  /** Example names for the sample file. */
  protected abstract readonly sampleNames: readonly [string, string]

  protected async sampleRows(suffix: string) {
    const [first, second] = this.sampleNames
    return [
      { name: `${first} ${suffix}`, status: 'active' },
      { name: `${second} ${suffix}`, status: 'archived' },
    ]
  }

  protected keyOf(row: NamedCsvRow) {
    return row.name
  }

  protected toCsvRow(entity: Entity) {
    return { name: entity.name, status: entity.isActive ? 'active' : 'archived' }
  }

  protected build(row: NamedCsvRow): NamedCsvData {
    return { name: row.name, isActive: row.status !== 'archived' }
  }
}
