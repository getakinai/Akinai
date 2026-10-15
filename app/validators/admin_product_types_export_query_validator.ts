import vine from '@vinejs/vine'
import { ADMIN_PRODUCT_TYPES_SORT_KEYS } from '#validators/admin_product_types_list_query_validator'
import { CSV_ACTIVE_STATUSES } from '#validators/helpers/csv_import_fields'
import { exportQuerySchema } from '#validators/helpers/list_query'

export const adminProductTypesExportQueryValidator = vine.create({
  ...exportQuerySchema(ADMIN_PRODUCT_TYPES_SORT_KEYS),
  status: vine.enum(CSV_ACTIVE_STATUSES).optional(),
})
