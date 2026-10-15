import { inject } from '@adonisjs/core'
import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import CustomerService from '#services/customer_service'

/**
 * Login page for each guard. Used when authentication fails.
 */
const loginRoutes: Record<keyof Authenticators, string> = {
  web: '/admin/login',
  customer: '/login',
}

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users. Sessions of Users that are no longer
 * active, and of Customers whose profile is archived, are ended.
 */
@inject()
export default class AuthMiddleware {
  constructor(protected customerService: CustomerService) {}

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const guard = options.guards?.[0] ?? ctx.auth.defaultGuard
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: loginRoutes[guard] })

    const usedGuard = (ctx.auth.authenticatedViaGuard ?? guard) as keyof Authenticators
    if (!(await this.isActive(ctx, usedGuard))) {
      await ctx.auth.use(usedGuard).logout()
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'session',
        redirectTo: loginRoutes[usedGuard],
      })
    }

    return next()
  }

  protected async isActive(ctx: HttpContext, guard: keyof Authenticators): Promise<boolean> {
    if (guard === 'web') {
      return ctx.auth.use('web').getUserOrFail().isActive
    }
    const account = ctx.auth.use('customer').getUserOrFail()
    const customer = await this.customerService.profileFor(account)
    return customer.isActive
  }
}
