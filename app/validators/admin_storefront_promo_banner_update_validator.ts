import vine from '@vinejs/vine'
import { storefrontPromoBannerFields } from '#validators/helpers/storefront_promo_banner_fields'

export const adminStorefrontPromoBannerUpdateValidator = vine.create(storefrontPromoBannerFields())
