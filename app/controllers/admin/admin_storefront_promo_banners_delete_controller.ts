import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'

@inject()
export default class AdminStorefrontPromoBannersDeleteController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const banner = await this.storefrontPromoBannerService.findOrFail(ctx.params.id)
    await this.storefrontPromoBannerService.delete(banner)
    return ctx.response.noContent()
  }
}
