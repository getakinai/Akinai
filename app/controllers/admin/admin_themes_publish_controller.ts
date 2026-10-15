import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { adminThemeIdValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesPublishController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemeIdValidator)
    await this.themeService.publish(params.id)
    return ctx.response.noContent()
  }
}
