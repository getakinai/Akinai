import vine from '@vinejs/vine'
import { MAX_BRAND_NAME_LENGTH } from '#constants/branding'

export const adminStorefrontBrandUpdateValidator = vine.create({
  brandName: vine.string().trim().maxLength(MAX_BRAND_NAME_LENGTH).nullable(),
})
