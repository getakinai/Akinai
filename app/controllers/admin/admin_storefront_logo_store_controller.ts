import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontBrandingService from '#services/storefront_branding_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'
import { adminStorefrontLogoStoreValidator } from '#validators/admin_storefront_logo_store_validator'

@inject()
export default class AdminStorefrontLogoStoreController {
  constructor(protected storefrontBrandingService: StorefrontBrandingService) {}

  async handle(ctx: HttpContext) {
    const { logo } = await ctx.request.validateUsing(adminStorefrontLogoStoreValidator)
    const theme = await this.storefrontBrandingService.setLogo(logo)
    return ctx.serialize(StorefrontThemeTransformer.transform(theme))
  }
}
