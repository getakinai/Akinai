import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontBrandingService from '#services/storefront_branding_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'

@inject()
export default class AdminStorefrontLogoDeleteController {
  constructor(protected storefrontBrandingService: StorefrontBrandingService) {}

  async handle(ctx: HttpContext) {
    const theme = await this.storefrontBrandingService.removeLogo()
    return ctx.serialize(StorefrontThemeTransformer.transform(theme))
  }
}
