import vine from '@vinejs/vine'
import { PROMO_PLACEMENTS } from '#constants/storefront'
import { storefrontPromoBannerFields } from '#validators/helpers/storefront_promo_banner_fields'

export const adminStorefrontPromoBannerStoreValidator = vine.create({
  placement: vine.enum(PROMO_PLACEMENTS),
  ...storefrontPromoBannerFields(),
})
