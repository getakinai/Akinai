import vine from '@vinejs/vine'
import { ADMIN_LOCATIONS_SORT_KEYS } from '#validators/admin_locations_list_query_validator'
import { CSV_ACTIVE_STATUSES } from '#validators/helpers/csv_import_fields'
import { exportQuerySchema } from '#validators/helpers/list_query'

export const adminLocationsExportQueryValidator = vine.create({
  ...exportQuerySchema(ADMIN_LOCATIONS_SORT_KEYS),
  status: vine.enum(CSV_ACTIVE_STATUSES).optional(),
})
