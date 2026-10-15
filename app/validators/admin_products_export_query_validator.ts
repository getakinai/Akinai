import vine from '@vinejs/vine'
import { PRODUCT_STATUSES } from '#models/product'
import { ADMIN_PRODUCTS_SORT_KEYS } from '#validators/admin_products_list_query_validator'
import { exportQuerySchema } from '#validators/helpers/list_query'

export const adminProductsExportQueryValidator = vine.create({
  ...exportQuerySchema(ADMIN_PRODUCTS_SORT_KEYS),
  status: vine.enum(PRODUCT_STATUSES).optional(),
})
