import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'
import StorefrontPromoBannerTransformer from '#transformers/storefront_promo_banner_transformer'
import { adminStorefrontPromoBannerUpdateValidator } from '#validators/admin_storefront_promo_banner_update_validator'

@inject()
export default class AdminStorefrontPromoBannersUpdateController {
  constructor(protected storefrontPromoBannerService: StorefrontPromoBannerService) {}

  async handle(ctx: HttpContext) {
    const banner = await this.storefrontPromoBannerService.findOrFail(ctx.params.id)
    const { eyebrow, title, buttonLabel, tone, type, collectionId, pageId, url, isVisible } =
      await ctx.request.validateUsing(adminStorefrontPromoBannerUpdateValidator)
    const updated = await this.storefrontPromoBannerService.update(banner, {
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

    return ctx.serialize(StorefrontPromoBannerTransformer.transform(updated))
  }
}
