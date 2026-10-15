import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { hasPermission } from '#abilities/main'
import type { Permission } from '#abilities/permissions'

type PermissionOptions =
  { permission: Permission } | { anyOf: readonly [Permission, ...Permission[]] }

/**
 * Guards a staff route with a catalog permission:
 * `.use(middleware.can({ permission: 'users.view' }))`, or with any one of
 * several: `.use(middleware.can({ anyOf: ['orders.view', 'support_tickets.view'] }))`
 */
export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: PermissionOptions) {
    if ('permission' in options) {
      await ctx.bouncer.authorize(hasPermission, options.permission)
      return next()
    }
    for (const permission of options.anyOf) {
      if (await ctx.bouncer.allows(hasPermission, permission)) return next()
    }
    await ctx.bouncer.authorize(hasPermission, options.anyOf[0])
    return next()
  }
}
