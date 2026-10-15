import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '../services/storefront_hero_slide_service.js'
import StorefrontHeroSlideTransformer from '../transformers/storefront_hero_slide_transformer.js'
import { adminStorefrontHeroSlideStoreValidator } from '../validators/admin_storefront_hero_slide_store_validator.js'

@inject()
export default class AdminStorefrontHeroSlidesStoreController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const {
      eyebrow,
      heading,
      subheading,
      buttonLabel,
      type,
      collectionId,
      pageId,
      url,
      isVisible,
    } = await ctx.request.validateUsing(adminStorefrontHeroSlideStoreValidator)
    const slide = await this.storefrontHeroSlideService.create({
      eyebrow,
      heading,
      subheading,
      buttonLabel,
      type,
      collectionId,
      pageId,
      url,
      isVisible,
    })

    ctx.response.status(201)
    return ctx.serialize(StorefrontHeroSlideTransformer.transform(slide))
  }
}
