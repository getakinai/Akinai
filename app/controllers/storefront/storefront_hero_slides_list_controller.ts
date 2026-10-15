import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '#services/storefront_hero_slide_service'
import StorefrontHeroSlideTransformer from '#transformers/storefront_hero_slide_transformer'

@inject()
export default class StorefrontHeroSlidesListController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const slides = await this.storefrontHeroSlideService.listPublic()
    return ctx.serialize(StorefrontHeroSlideTransformer.transform(slides).useVariant('toPublic'))
  }
}
