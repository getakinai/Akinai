import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeService from '#services/theme_service'
import ThemeTransformer from '#transformers/theme_transformer'

@inject()
export default class AdminThemesListController {
  constructor(protected themeService: ThemeService) {}

  async handle(ctx: HttpContext) {
    const themes = await this.themeService.library()
    return ctx.serialize(ThemeTransformer.transform(themes))
  }
}
