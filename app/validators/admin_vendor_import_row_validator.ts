import vine from '@vinejs/vine'
import { csvNamedRowSchema } from '#validators/helpers/csv_import_fields'

/** One row of a vendor import CSV. */
export const adminVendorImportRowValidator = vine.create(csvNamedRowSchema(100))
