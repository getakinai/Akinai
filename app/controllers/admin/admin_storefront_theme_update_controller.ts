import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontThemeService from '#services/storefront_theme_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'
import { adminStorefrontThemeUpdateValidator } from '#validators/admin_storefront_theme_update_validator'

@inject()
export default class AdminStorefrontThemeUpdateController {
  constructor(protected storefrontThemeService: StorefrontThemeService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStorefrontThemeUpdateValidator)
    const theme = await this.storefrontThemeService.update(payload)
    return ctx.serialize(StorefrontThemeTransformer.transform(theme))
  }
}
