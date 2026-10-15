import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '#services/storefront_hero_slide_service'
import StorefrontHeroSlideTransformer from '#transformers/storefront_hero_slide_transformer'

@inject()
export default class AdminStorefrontHeroSlideImageDeleteController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const slide = await this.storefrontHeroSlideService.findOrFail(ctx.params.id)
    const updated = await this.storefrontHeroSlideService.removeImage(slide)
    return ctx.serialize(StorefrontHeroSlideTransformer.transform(updated))
  }
}
