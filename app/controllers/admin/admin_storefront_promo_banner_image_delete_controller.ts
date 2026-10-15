import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'
import StorefrontPromoBannerTransformer from '#transformers/storefront_promo_banner_transformer'

@inject()
export default class AdminStorefrontPromoBannerImageDeleteController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const banner = await this.storefrontPromoBannerService.findOrFail(ctx.params.id)
    const updated = await this.storefrontPromoBannerService.removeImage(banner)
    return ctx.serialize(StorefrontPromoBannerTransformer.transform(updated))
  }
}
