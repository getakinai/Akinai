import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'
import StorefrontPromoBannerTransformer from '#transformers/storefront_promo_banner_transformer'
import { adminStorefrontPromoBannerImageStoreValidator } from '#validators/admin_storefront_promo_banner_image_store_validator'

@inject()
export default class AdminStorefrontPromoBannerImageStoreController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const banner = await this.storefrontPromoBannerService.findOrFail(ctx.params.id)
    const { image } = await ctx.request.validateUsing(adminStorefrontPromoBannerImageStoreValidator)
    const updated = await this.storefrontPromoBannerService.setImage(banner, image)
    return ctx.serialize(StorefrontPromoBannerTransformer.transform(updated))
  }
}
