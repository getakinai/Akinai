import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import { adminThemeIdValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesDownloadController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminThemeIdValidator)
    const { filename, contents } = await this.themeService.download(params.id)
    ctx.response.header('Content-Type', 'application/zip')
    ctx.response.attachment(filename)
    return ctx.response.send(Buffer.from(contents))
  }
}
