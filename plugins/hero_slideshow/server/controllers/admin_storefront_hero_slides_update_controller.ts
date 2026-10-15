import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHeroSlideService from '../services/storefront_hero_slide_service.js'
import StorefrontHeroSlideTransformer from '../transformers/storefront_hero_slide_transformer.js'
import { adminStorefrontHeroSlideUpdateValidator } from '../validators/admin_storefront_hero_slide_update_validator.js'

@inject()
export default class AdminStorefrontHeroSlidesUpdateController {
  constructor(protected storefrontHeroSlideService: StorefrontHeroSlideService) {}

  async handle(ctx: HttpContext) {
    const slide = await this.storefrontHeroSlideService.findOrFail(ctx.params.id)
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
    } = await ctx.request.validateUsing(adminStorefrontHeroSlideUpdateValidator)
    const updated = await this.storefrontHeroSlideService.update(slide, {
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

    return ctx.serialize(StorefrontHeroSlideTransformer.transform(updated))
  }
}
