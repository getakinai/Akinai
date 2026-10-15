import vine from '@vinejs/vine'
import { variantMarketPricesSchema } from '#validators/helpers/market_price_fields'
import { productCatalogOptionsSchema } from '#validators/helpers/product_options_catalog'
import { productImageFields } from '#validators/helpers/product_image_fields'
import { productMerchandisingFields } from '#validators/helpers/product_merchandising_fields'
import { seoFields } from '#validators/helpers/seo_fields'
import { weightAmount } from '#validators/helpers/weight_fields'

export const adminProductStoreValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
  description: vine.string().trim().maxLength(10_000).nullable(),
  status: vine.enum(['draft', 'active'] as const),
  chargeTax: vine.boolean({ strict: true }).optional(),
  freeShipping: vine.boolean({ strict: true }).optional(),
  ...productMerchandisingFields(),
  ...productImageFields(),
  ...seoFields(),
  price: vine.number({ strict: true }).min(0).max(9_999_999_999.99).decimal([0, 2]),
  compareAtPrice: vine
    .number({ strict: true })
    .min(0)
    .max(9_999_999_999.99)
    .decimal([0, 2])
    .nullable()
    .optional(),
  weight: weightAmount().nullable().optional(),
  marketPrices: variantMarketPricesSchema(),
  options: productCatalogOptionsSchema(),
})
