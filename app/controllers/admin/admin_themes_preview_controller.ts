import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { THEME_PREVIEW_SESSION_KEY, type ThemePreviewState } from '#theme_host/renderer'
import { adminThemePreviewValidator } from '#validators/admin_theme_validators'

/** Opens the storefront as `:id` for this session, with a preview bar. */
@inject()
export default class AdminThemesPreviewController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemePreviewValidator)
    if (params.id !== 'builtin') await this.themeService.findOrFail(params.id)
    const preview: ThemePreviewState = { themeId: params.id, staff: true }
    ctx.session.put(THEME_PREVIEW_SESSION_KEY, preview)
    return ctx.response.redirect('/')
  }
}
