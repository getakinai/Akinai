import vine from '@vinejs/vine'
import { storefrontLinkFields } from '#validators/helpers/storefront_menu_fields'

export const storefrontHeroSlideFields = () => ({
  eyebrow: vine.string().trim().maxLength(60).nullable().optional(),
  heading: vine.string().trim().minLength(1).maxLength(120),
  subheading: vine.string().trim().maxLength(240).nullable().optional(),
  buttonLabel: vine.string().trim().maxLength(30).nullable().optional(),
  ...storefrontLinkFields(),
  isVisible: vine.boolean({ strict: true }).optional(),
})
