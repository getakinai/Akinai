import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '#services/storefront_hero_slide_service'
import { adminStorefrontHeroSlideReorderValidator } from '#validators/admin_storefront_hero_slide_reorder_validator'

@inject()
export default class AdminStorefrontHeroSlidesReorderController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const { ids } = await ctx.request.validateUsing(adminStorefrontHeroSlideReorderValidator)
    await this.storefrontHeroSlideService.reorder(ids)
    return ctx.response.noContent()
  }
}
