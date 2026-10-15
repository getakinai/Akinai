import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { hasPermission } from '#abilities/main'
import { THEME_EDITOR_SESSION_KEY, THEME_PREVIEW_SESSION_KEY } from '#theme_host/renderer'

/**
 * The theme editor and staff preview open the storefront in a same-origin
 * iframe. Shield defaults to `frame-ancestors 'none'` and `X-Frame-Options:
 * DENY`; relax both only while a staff member has an editor or preview session.
 */
export default class ThemeEditorFrameMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await next()

    const user = ctx.auth.use('web').user
    if (!user) return

    const editor = ctx.session.get(THEME_EDITOR_SESSION_KEY) as { themeId?: string } | undefined
    if (editor?.themeId && (await ctx.bouncer.allows(hasPermission, 'themes.edit'))) {
      this.allowSameOriginFrame(ctx)
      return
    }

    const preview = ctx.session.get(THEME_PREVIEW_SESSION_KEY) as
      { themeId?: string; staff?: boolean } | undefined
    if (
      preview?.themeId &&
      preview.staff &&
      (await ctx.bouncer.allows(hasPermission, 'themes.view'))
    ) {
      this.allowSameOriginFrame(ctx)
    }
  }

  private allowSameOriginFrame(ctx: HttpContext) {
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
