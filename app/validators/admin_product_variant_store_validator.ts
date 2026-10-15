import vine from '@vinejs/vine'
import { variantFields } from '#validators/helpers/product_variant_fields'

export const adminProductVariantStoreValidator = vine.create(variantFields())
