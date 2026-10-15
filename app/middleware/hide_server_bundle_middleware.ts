import { posix } from 'node:path'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const SERVER_BUNDLE_DIR = '/assets/server'

/** The path as the static middleware resolves it: decoded, normalized, case-folded. */
function resolvedPath(url: string): string | null {
  try {
    return posix.normalize(decodeURIComponent(url)).toLowerCase()
  } catch {
    return null
  }
}

/**
 * The SSR bundle is built into `public/assets/server` (the path the Vite
 * server module loader reads from), which the static middleware would
 * otherwise serve. Server code is never a public asset, so answer 404.
 */
export default class HideServerBundleMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    const path = resolvedPath(ctx.request.url())
    if (path === null) return ctx.response.notFound('Not found')
    if (path === SERVER_BUNDLE_DIR || path.startsWith(`${SERVER_BUNDLE_DIR}/`)) {
      return ctx.response.notFound('Not found')
    }
    return next()
  }
}
