import vine from '@vinejs/vine'
import { csvActiveStatusField, csvNameField } from '#validators/helpers/csv_import_fields'

/** Separator between the values in an option import row's `values` cell. */
export const OPTION_CSV_VALUE_SEPARATOR = '|'

export const MAX_OPTION_CSV_VALUES = 100

export const MAX_OPTION_VALUE_LENGTH = 64

/**
 * One row of an option import CSV. `values` (e.g. `S|M|L`) is split and
 * checked by OptionCsvService.
 */
export const adminOptionImportRowValidator = vine.create({
  name: csvNameField(64),
  values: vine.string().trim().maxLength(10_000).optional(),
  status: csvActiveStatusField(),
})
