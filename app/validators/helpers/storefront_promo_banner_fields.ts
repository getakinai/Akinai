import vine from '@vinejs/vine'
import { PROMO_TONES } from '#constants/storefront'
import { storefrontLinkFields } from '#validators/helpers/storefront_menu_fields'

export const storefrontPromoBannerFields = () => ({
  eyebrow: vine.string().trim().maxLength(40).nullable().optional(),
  title: vine.string().trim().minLength(1).maxLength(100),
  buttonLabel: vine.string().trim().maxLength(30).nullable().optional(),
  tone: vine.enum(PROMO_TONES),
  ...storefrontLinkFields(),
  isVisible: vine.boolean({ strict: true }).optional(),
})
