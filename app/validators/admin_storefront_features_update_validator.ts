import vine from '@vinejs/vine'
import { FEATURE_ICONS, MAX_FEATURES } from '#constants/storefront'

export const adminStorefrontFeaturesUpdateValidator = vine.create({
  items: vine
    .array(
      vine.object({
        icon: vine.enum(FEATURE_ICONS),
        title: vine.string().trim().minLength(1).maxLength(40),
        text: vine.string().trim().minLength(1).maxLength(120),
      })
    )
    .maxLength(MAX_FEATURES),
})
