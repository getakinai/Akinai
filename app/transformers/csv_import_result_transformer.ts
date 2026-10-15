import { BaseTransformer } from '@adonisjs/core/transformers'
import type { CsvImportResult } from '#services/base_csv_transfer_service'

/**
 * Outcome of a CSV import: records created, updated and skipped, and the
 * reasons rows were rejected.
 */
export default class CsvImportResultTransformer extends BaseTransformer<CsvImportResult> {
  toObject() {
    return {
      created: this.resource.created,
      updated: this.resource.updated,
      skipped: this.resource.skipped,
      errorCount: this.resource.errorCount,
      errors: this.resource.errors.map(({ row, field, message }) => ({ row, field, message })),
    }
  }
}
