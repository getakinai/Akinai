import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ThemeRepository from '#repositories/theme_repository'
import { THEME_PREVIEW_SESSION_KEY, type ThemePreviewState } from '#theme_host/renderer'

/** Opens a shared theme preview link (signed by the back office). */
@inject()
export default class ThemePreviewShowController {
  constructor(protected themeRepository: ThemeRepository) {}

  async handle(ctx: HttpContext) {
    if (!ctx.request.hasValidSignature()) {
      return ctx.response.status(410).send('This preview link has expired.')
    }
    const theme = await this.themeRepository.find(String(ctx.params.id))
    if (!theme) return ctx.response.status(410).send('This theme is no longer available.')
    const preview: ThemePreviewState = { themeId: theme.id, staff: false }
    ctx.session.put(THEME_PREVIEW_SESSION_KEY, preview)
    return ctx.response.redirect().withQs(false).toPath('/')
  }
}
