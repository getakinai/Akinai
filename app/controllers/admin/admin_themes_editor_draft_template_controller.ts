import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { ThemeTemplateData } from '#constants/themes'
import ThemeService from '#services/theme_service'
import { adminThemeDraftTemplateValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesEditorDraftTemplateController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params, ...body } = await ctx.request.validateUsing(adminThemeDraftTemplateValidator)
    await this.themeService.updateDraftTemplate(params.id, params.name, body as ThemeTemplateData)
    return ctx.response.noContent()
  }
}
