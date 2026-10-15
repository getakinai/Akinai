import type { HttpContext } from '@adonisjs/core/http'
import { THEME_EDITOR_SESSION_KEY } from '#theme_host/renderer'
import { adminThemeIdValidator } from '#validators/admin_theme_validators'

export default class AdminThemesEditorExitController {
  async handle(ctx: HttpContext) {
    await ctx.request.validateUsing(adminThemeIdValidator)
    ctx.session.forget(THEME_EDITOR_SESSION_KEY)
    return ctx.response.redirect().toRoute('admin.themes.home')
  }
}
