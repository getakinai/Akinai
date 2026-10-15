import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { DownPayload } from '@foadonis/maintenance/types'
import BaseMaintenanceMiddleware from '@foadonis/maintenance/maintenance_middleware'

/**
 * Renders the maintenance page for requests flagged by
 * `MaintenanceMiddleware`, unless a staff User is signed in. Runs in the
 * router stack after `SilentAuthMiddleware` and
 * `UserSessionVersionMiddleware`, so the `web` guard is already resolved
 * and stale staff sessions are already signed out. Customers are treated
 * like guests.
 */
export default class MaintenanceGateMiddleware extends BaseMaintenanceMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const data = ctx.maintenance
    if (!data) {
      return next()
    }

    if (ctx.auth.use('web').user) {
      return next()
    }

    if (data.redirect) {
      return ctx.response.redirect().toPath(data.redirect)
    }

    const page = data.template ?? (await ctx.view.render('maintenance'))
    return this.withHeaders(ctx.response, data).status(data.status).send(page)
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    maintenance?: DownPayload
  }
}
