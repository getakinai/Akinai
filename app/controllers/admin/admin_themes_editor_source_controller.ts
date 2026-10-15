import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { THEME_EDITOR_SESSION_KEY } from '#theme_host/renderer'
import {
  adminThemeEditorSourceValidator,
  adminThemeIdValidator,
} from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesEditorSourceController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemeIdValidator)
    const { path } = await ctx.request.validateUsing(adminThemeEditorSourceValidator, {
      data: ctx.request.qs(),
    })

    const editor = ctx.session.get(THEME_EDITOR_SESSION_KEY) as { themeId?: string } | undefined
    if (editor?.themeId !== params.id) {
      return ctx.response.forbidden({
        errors: [{ message: 'Open the theme editor for this theme first.' }],
      })
    }

    const source = await this.themeService.readEditorSource(params.id, path)
    if (!source) return ctx.response.notFound()

    return ctx.serialize(source)
  }
}
