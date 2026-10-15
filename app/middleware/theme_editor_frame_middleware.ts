import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { hasPermission } from '#abilities/main'
import { THEME_EDITOR_SESSION_KEY } from '#theme_host/renderer'

/**
 * The theme editor previews the storefront in a same-origin iframe. Shield
 * defaults to `frame-ancestors 'none'` and `X-Frame-Options: DENY`; relax
 * both only while a staff member with `themes.edit` has an editor session.
 */
export default class ThemeEditorFrameMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await next()

    const editor = ctx.session.get(THEME_EDITOR_SESSION_KEY) as { themeId?: string } | undefined
    if (!editor?.themeId) return

    const user = ctx.auth.use('web').user
    if (!user || !(await ctx.bouncer.allows(hasPermission, 'themes.edit'))) return

    ctx.response.header('X-Frame-Options', 'SAMEORIGIN')

    const csp = ctx.response.response.getHeader('content-security-policy')
    if (typeof csp === 'string') {
      ctx.response.header(
        'content-security-policy',
        csp.replace(/frame-ancestors\s+'none'/, "frame-ancestors 'self'")
      )
    }
  }
}
