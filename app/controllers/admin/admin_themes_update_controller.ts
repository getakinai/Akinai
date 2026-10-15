import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { adminThemeRenameValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesUpdateController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params, name } = await ctx.request.validateUsing(adminThemeRenameValidator)
    await this.themeService.rename(params.id, name)
    return ctx.response.noContent()
  }
}
