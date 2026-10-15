import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import ThemeTransformer from '#transformers/theme_transformer'
import { adminThemeStoreValidator } from '#validators/admin_theme_validators'

@inject()
export default class AdminThemesStoreController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const { theme: file } = await ctx.request.validateUsing(adminThemeStoreValidator)
    const user = ctx.auth.use('web').getUserOrFail()
    const theme = await this.themeService.upload(file.tmpPath!, user.id)
    await theme.load('uploadedBy')
    ctx.response.status(201)
    return ctx.serialize(ThemeTransformer.transform(theme))
  }
}
