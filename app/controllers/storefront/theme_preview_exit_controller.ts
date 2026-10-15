import type { HttpContext } from '@adonisjs/core/http'
import { THEME_PREVIEW_SESSION_KEY } from '#theme_host/renderer'

export default class ThemePreviewExitController {
  async handle(ctx: HttpContext) {
    ctx.session.forget(THEME_PREVIEW_SESSION_KEY)
    return ctx.response.redirect('/')
  }
}
