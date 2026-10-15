import vine from '@vinejs/vine'
import { storefrontHeroSlideFields } from '#validators/helpers/storefront_hero_slide_fields'

export const adminStorefrontHeroSlideUpdateValidator = vine.create(storefrontHeroSlideFields())
