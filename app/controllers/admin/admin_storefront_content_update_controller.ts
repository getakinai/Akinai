import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontThemeService from '#services/storefront_theme_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'
import { adminStorefrontContentUpdateValidator } from '#validators/admin_storefront_content_update_validator'

@inject()
export default class AdminStorefrontContentUpdateController {
  constructor(protected storefrontThemeService: StorefrontThemeService) {}

  async handle(ctx: HttpContext) {
    const { announcementText, announcementUrl, footerTagline } = await ctx.request.validateUsing(
      adminStorefrontContentUpdateValidator
    )
    const theme = await this.storefrontThemeService.setContent({
      announcementText,
      announcementUrl,
      footerTagline,
    })
    return ctx.serialize(StorefrontThemeTransformer.transform(theme))
  }
}
