import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '../services/storefront_hero_slide_service.js'
import StorefrontHeroSlideTransformer from '../transformers/storefront_hero_slide_transformer.js'
import { adminStorefrontHeroSlideImageStoreValidator } from '../validators/admin_storefront_hero_slide_image_store_validator.js'

@inject()
export default class AdminStorefrontHeroSlideImageStoreController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const slide = await this.storefrontHeroSlideService.findOrFail(ctx.params.id)
    const { image } = await ctx.request.validateUsing(adminStorefrontHeroSlideImageStoreValidator)
    const updated = await this.storefrontHeroSlideService.setImage(slide, image)
    return ctx.serialize(StorefrontHeroSlideTransformer.transform(updated))
  }
}
