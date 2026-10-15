import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { adminThemeIdValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesEditorDataController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemeIdValidator)
    const payload = await this.themeService.editorPayload(params.id)
    return ctx.serialize({
      theme: {
        id: payload.theme.id,
        name: payload.theme.name,
        role: payload.theme.role,
        key: payload.theme.key,
      },
      settingsSchema: payload.settingsSchema,
      sectionSchemas: payload.sectionSchemas,
      settings: payload.settings,
      templates: payload.templates,
      previewPaths: payload.previewPaths,
    })
  }
}
