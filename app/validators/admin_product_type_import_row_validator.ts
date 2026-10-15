import vine from '@vinejs/vine'
import { csvNamedRowSchema } from '#validators/helpers/csv_import_fields'

/** One row of a product type import CSV. */
export const adminProductTypeImportRowValidator = vine.create(csvNamedRowSchema(100))
