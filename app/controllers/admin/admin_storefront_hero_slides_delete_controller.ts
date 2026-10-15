import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '#services/storefront_hero_slide_service'

@inject()
export default class AdminStorefrontHeroSlidesDeleteController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const slide = await this.storefrontHeroSlideService.findOrFail(ctx.params.id)
    await this.storefrontHeroSlideService.delete(slide)
    return ctx.response.noContent()
  }
}
