import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ImpersonationService from '#services/impersonation_service'
import StorefrontSessionTransformer from '#transformers/storefront_session_transformer'

/**
 * Whether a customer is signed in, for public pages. Answers guests with
 * `signedIn: false` instead of the 401 that `/account/me` returns.
 * SilentAuthMiddleware has already checked the `customer` guard.
 *
 * `maintenance` is true when the store is in maintenance mode and a staff
 * User is browsing it (everyone else gets the maintenance page instead).
 *
 * `impersonation` names the customer a staff User is signed in as, for the
 * storefront banner.
 */
@inject()
export default class StorefrontSessionViewController {
  constructor(protected impersonationService: ImpersonationService) {}

  async handle(ctx: HttpContext) {
    const signedIn = ctx.auth.use('customer').isAuthenticated
    const maintenance = Boolean(ctx.maintenance) && ctx.auth.use('web').isAuthenticated
    const impersonation = await this.impersonationService.current(ctx)
    return ctx.serialize(
      StorefrontSessionTransformer.transform({ signedIn, maintenance, impersonation })
    )
  }
}
