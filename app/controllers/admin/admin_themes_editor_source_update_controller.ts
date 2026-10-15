import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemePackageException from '#exceptions/theme_package_exception'
import ThemeService from '#services/theme_service'
import { THEME_EDITOR_SESSION_KEY } from '#theme_host/renderer'
import { adminThemeEditorSourceWriteValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesEditorSourceUpdateController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params, path, content } = await ctx.request.validateUsing(
      adminThemeEditorSourceWriteValidator
    )

    const editor = ctx.session.get(THEME_EDITOR_SESSION_KEY) as { themeId?: string } | undefined
    if (editor?.themeId !== params.id) {
      return ctx.response.forbidden({
        errors: [{ message: 'Open the theme editor for this theme first.' }],
      })
    }

    try {
      await this.themeService.writeEditorSource(params.id, path, content ?? '')
    } catch (error) {
      if (error instanceof ThemePackageException) {
        return ctx.response.status(422).send({
          errors: error.problems.map((message) => ({ message })),
        })
      }
      throw error
    }

    return ctx.response.noContent()
  }
}
