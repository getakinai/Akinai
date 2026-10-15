import vine from '@vinejs/vine'
import { productImageFields } from '#validators/helpers/product_image_fields'
import { productMerchandisingFields } from '#validators/helpers/product_merchandising_fields'
import { seoFields } from '#validators/helpers/seo_fields'

export const adminProductUpdateValidator = vine.withMetaData<{ productId: string }>().create({
  title: vine.string().trim().minLength(1).maxLength(255),
  description: vine.string().trim().maxLength(10_000).nullable(),
  status: vine.enum(['draft', 'active'] as const),
  chargeTax: vine.boolean({ strict: true }).optional(),
  freeShipping: vine.boolean({ strict: true }).optional(),
  ...productMerchandisingFields(),
  ...productImageFields(),
  ...seoFields(),
})
