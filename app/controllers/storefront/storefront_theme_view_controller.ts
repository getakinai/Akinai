import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontThemeService from '#services/storefront_theme_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'

@inject()
export default class StorefrontThemeViewController {
  constructor(protected storefrontThemeService: StorefrontThemeService) {}

  async handle(ctx: HttpContext) {
    const theme = await this.storefrontThemeService.get()
    return ctx.serialize(StorefrontThemeTransformer.transform(theme).useVariant('toPublic'))
  }
}
