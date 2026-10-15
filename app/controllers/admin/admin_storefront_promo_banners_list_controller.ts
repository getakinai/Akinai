import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'
import StorefrontPromoBannerTransformer from '#transformers/storefront_promo_banner_transformer'

@inject()
export default class AdminStorefrontPromoBannersListController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const banners = await this.storefrontPromoBannerService.list()
    return ctx.serialize(StorefrontPromoBannerTransformer.transform(banners))
  }
}
