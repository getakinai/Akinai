import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { MaintenanceDriver } from '@foadonis/maintenance'
import BaseMaintenanceMiddleware from '@foadonis/maintenance/maintenance_middleware'
import maintenanceService from '@foadonis/maintenance/services/main'

/**
 * Back-office paths stay reachable while the storefront is in maintenance
 * mode (`node ace down`). The back office lives under `/admin`.
 */
const EXCLUDED_PATH_PREFIXES = ['/admin']

/**
 * Crawler files stay reachable too, so search engines keep the crawl rules
 * (including the AI crawler blocks) while the storefront is down. The
 * maintenance page reads `/store/plugins` to mount installed plugins' forms,
 * and the newsletter plugin's form posts to `/maintenance/newsletter`.
 */
const EXCLUDED_PATHS = ['/robots.txt', '/sitemap.xml', '/store/plugins', '/maintenance/newsletter']

export function isExcludedFromMaintenance(path: string) {
  return (
    EXCLUDED_PATHS.includes(path) ||
    EXCLUDED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  )
}

/**
 * Handles the parts of maintenance mode that don't need a session: the
 * excluded paths, the secret bypass URL (it has no route, so this must run
 * in the server stack) and the bypass cookie. Otherwise it stores the
 * payload on `ctx.maintenance` and `MaintenanceGateMiddleware` decides,
 * once auth has run, whether to render the maintenance page.
 */
export default class MaintenanceMiddleware extends BaseMaintenanceMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (isExcludedFromMaintenance(ctx.request.url(false))) {
      return next()
    }

    // The package's `DriversList` typing always resolves `driver()` to `never`.
    const maintenance = maintenanceService.driver() as MaintenanceDriver
    if (!(await maintenance.active())) {
      return next()
    }

    const data = await maintenance.data()

    if (data.secret && ctx.request.url(false) === `/${data.secret}`) {
      return this.bypassResponse(ctx.response, data.secret)
    }

    if (data.secret && (await this.hasValidBypassCookie(ctx.request, data.secret))) {
      return next()
    }

    ctx.maintenance = data
    return next()
  }
}
