import vine from '@vinejs/vine'
import { productCatalogOptionsSchema } from '#validators/helpers/product_options_catalog'

export const adminProductOptionsUpdateValidator = vine.create({
  options: productCatalogOptionsSchema(),
})
