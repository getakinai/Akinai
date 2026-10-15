import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { THEME_SHARE_PREVIEW_EXPIRES_IN } from '#constants/themes'
import ThemeService from '#services/theme_service'
import { absoluteUrl } from '#utils/app_url'
import { adminThemeIdValidator } from '#validators/admin_theme_validators'

/** A signed link that previews an unpublished theme without signing in. */
@inject()
export default class AdminThemesShareController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemeIdValidator)
    const theme = await this.themeService.findOrFail(params.id)
    const path = signedUrlFor(
      'storefront.theme_preview.show',
      { id: theme.id },
      { expiresIn: THEME_SHARE_PREVIEW_EXPIRES_IN }
    )
    return { data: { url: absoluteUrl(path), expiresIn: THEME_SHARE_PREVIEW_EXPIRES_IN } }
  }
}
