import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontBrandingService from '#services/storefront_branding_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'
import { adminStorefrontFaviconStoreValidator } from '#validators/admin_storefront_favicon_store_validator'

@inject()
export default class AdminStorefrontFaviconStoreController {
  constructor(protected storefrontBrandingService: StorefrontBrandingService) {}

  async handle(ctx: HttpContext) {
    const { favicon } = await ctx.request.validateUsing(adminStorefrontFaviconStoreValidator)
    const theme = await this.storefrontBrandingService.setFavicon(favicon)
    return ctx.serialize(StorefrontThemeTransformer.transform(theme))
  }
}
