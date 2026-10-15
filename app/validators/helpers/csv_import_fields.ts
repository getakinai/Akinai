import vine from '@vinejs/vine'

export const CSV_ACTIVE_STATUSES = ['active', 'archived'] as const

export type CsvActiveStatus = (typeof CSV_ACTIVE_STATUSES)[number]

/**
 * Cells of CSV import rows. Empty cells are removed before validation, so
 * they read as omitted.
 */
export const csvNameField = (maxLength: number) =>
  vine.string().trim().minLength(1).maxLength(maxLength)

/** `active` (the default) or `archived`. */
export const csvActiveStatusField = () => vine.enum(CSV_ACTIVE_STATUSES).optional()

/** A row with only a name and an archived flag (vendors, product types). */
export const csvNamedRowSchema = (maxLength: number) => ({
  name: csvNameField(maxLength),
  status: csvActiveStatusField(),
})
