import vine from '@vinejs/vine'
import { productTypeFields } from '#validators/helpers/product_type_fields'

export const adminProductTypeStoreValidator = vine.create(productTypeFields())
