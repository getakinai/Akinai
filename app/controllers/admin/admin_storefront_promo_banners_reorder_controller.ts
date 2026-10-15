import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'
import { adminStorefrontPromoBannerReorderValidator } from '#validators/admin_storefront_promo_banner_reorder_validator'

@inject()
export default class AdminStorefrontPromoBannersReorderController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const { placement, ids } = await ctx.request.validateUsing(
      adminStorefrontPromoBannerReorderValidator
    )
    await this.storefrontPromoBannerService.reorder(placement, ids)
    return ctx.response.noContent()
  }
}
