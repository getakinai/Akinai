import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { THEME_EDITOR_SESSION_KEY } from '#theme_host/renderer'
import { adminThemeIdValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesEditorHomeController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemeIdValidator)
    const theme = await this.themeService.findOrFail(params.id)
    ctx.session.put(THEME_EDITOR_SESSION_KEY, { themeId: theme.id })
    return ctx.inertia.render('admin/themes/editor', {
      themeId: theme.id,
      themeName: theme.name,
      themeRole: theme.role,
    })
  }
}
