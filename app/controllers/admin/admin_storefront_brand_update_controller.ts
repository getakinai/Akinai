import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontBrandingService from '#services/storefront_branding_service'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'
import { adminStorefrontBrandUpdateValidator } from '#validators/admin_storefront_brand_update_validator'

@inject()
export default class AdminStorefrontBrandUpdateController {
  constructor(protected storefrontBrandingService: StorefrontBrandingService) {}

  async handle(ctx: HttpContext) {
    const { brandName } = await ctx.request.validateUsing(adminStorefrontBrandUpdateValidator)
    const theme = await this.storefrontBrandingService.setBrandName(brandName)
    return ctx.serialize(StorefrontThemeTransformer.transform(theme))
  }
}
