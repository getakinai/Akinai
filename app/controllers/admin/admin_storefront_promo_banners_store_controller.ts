import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'
import StorefrontPromoBannerTransformer from '#transformers/storefront_promo_banner_transformer'
import { adminStorefrontPromoBannerStoreValidator } from '#validators/admin_storefront_promo_banner_store_validator'

@inject()
export default class AdminStorefrontPromoBannersStoreController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const {
      placement,
      eyebrow,
      title,
      buttonLabel,
      tone,
      type,
      collectionId,
      pageId,
      url,
      isVisible,
    } = await ctx.request.validateUsing(adminStorefrontPromoBannerStoreValidator)
    const banner = await this.storefrontPromoBannerService.create(placement, {
      eyebrow,
      title,
      buttonLabel,
      tone,
      type,
      collectionId,
      pageId,
      url,
      isVisible,
    })

    ctx.response.status(201)
    return ctx.serialize(StorefrontPromoBannerTransformer.transform(banner))
  }
}
