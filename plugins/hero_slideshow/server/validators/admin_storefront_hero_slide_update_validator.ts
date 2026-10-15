import vine from '@vinejs/vine'
import { storefrontHeroSlideFields } from './helpers/storefront_hero_slide_fields.js'

export const adminStorefrontHeroSlideUpdateValidator = vine.create(storefrontHeroSlideFields())
