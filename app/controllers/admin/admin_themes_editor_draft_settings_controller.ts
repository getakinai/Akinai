import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { ThemeSettingsData } from '#constants/themes'
import ThemeService from '#services/theme_service'
import { adminThemeDraftSettingsValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesEditorDraftSettingsController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params, ...body } = await ctx.request.validateUsing(adminThemeDraftSettingsValidator)
    await this.themeService.updateDraftSettings(params.id, body as ThemeSettingsData)
    return ctx.response.noContent()
  }
}
