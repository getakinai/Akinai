import vine from '@vinejs/vine'
import { MAX_HERO_SLIDES } from '../constants.js'

export const adminStorefrontHeroSlideReorderValidator = vine.create({
  ids: vine.array(vine.string().uuid()).minLength(1).maxLength(MAX_HERO_SLIDES).distinct(),
})
