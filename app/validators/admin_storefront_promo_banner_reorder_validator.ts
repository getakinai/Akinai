import vine from '@vinejs/vine'
import { MAX_PROMO_BANNERS_PER_PLACEMENT, PROMO_PLACEMENTS } from '#constants/storefront'

export const adminStorefrontPromoBannerReorderValidator = vine.create({
  placement: vine.enum(PROMO_PLACEMENTS),
  ids: vine
    .array(vine.string().uuid())
    .minLength(1)
    .maxLength(MAX_PROMO_BANNERS_PER_PLACEMENT)
    .distinct(),
})
