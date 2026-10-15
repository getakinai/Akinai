import type { HttpContext } from '@adonisjs/core/http'
import { THEME_ASSET_CONTENT_TYPES } from '#constants/themes'
import Theme from '#models/theme'
import { ensureThemeExtracted, readThemeFile } from '#theme_host/storage'

/**
 * Files under `assets/` of a theme package, plus its preview image. URLs
 * carry the package hash, so responses never change and cache for a year.
 */
export default class ThemeAssetsShowController {
  async handle(ctx: HttpContext) {
    const hash = String(ctx.params.hash)
    const path = (ctx.params['*'] as string[] | undefined)?.join('/') ?? ''
    if (!/^[0-9a-f]{64}$/.test(hash) || !/^[A-Za-z0-9_][A-Za-z0-9_./-]*$/.test(path)) {
      return ctx.response.notFound()
    }
    const theme = await Theme.findBy('package_hash', hash)
    const isAsset = path.startsWith('assets/') || path === theme?.previewImage
    const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
    const contentType = THEME_ASSET_CONTENT_TYPES[extension]
    if (!theme || !isAsset || !contentType || path.includes('..')) return ctx.response.notFound()

    const file = await readThemeFile(await ensureThemeExtracted(theme), path)
    if (!file) return ctx.response.notFound()

    ctx.response.header('Content-Type', contentType)
    ctx.response.header('Cache-Control', 'public, max-age=31536000, immutable')
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    if (extension === 'svg') {
      ctx.response.header(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'"
      )
    }
    return ctx.response.send(file)
  }
}
