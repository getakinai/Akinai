import vine from '@vinejs/vine'
import { ADMIN_OPTION_DEFINITIONS_SORT_KEYS } from '#validators/admin_option_definitions_list_query_validator'
import { CSV_ACTIVE_STATUSES } from '#validators/helpers/csv_import_fields'
import { exportQuerySchema } from '#validators/helpers/list_query'

export const adminOptionsExportQueryValidator = vine.create({
  ...exportQuerySchema(ADMIN_OPTION_DEFINITIONS_SORT_KEYS),
  status: vine.enum(CSV_ACTIVE_STATUSES).optional(),
})
