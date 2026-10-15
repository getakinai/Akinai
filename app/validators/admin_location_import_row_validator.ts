import vine from '@vinejs/vine'
import { csvActiveStatusField } from '#validators/helpers/csv_import_fields'

/** One row of a location import CSV. Empty cells read as omitted. */
export const adminLocationImportRowValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(100),
  address_line: vine.string().trim().maxLength(255).optional(),
  city: vine.string().trim().maxLength(100).optional(),
  country: vine.string().trim().maxLength(100).optional(),
  status: csvActiveStatusField(),
})
