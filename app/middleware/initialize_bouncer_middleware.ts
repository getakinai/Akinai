import * as abilities from '#abilities/main'
import { policies } from '#generated/policies'
import type User from '#models/user'
import UserService from '#services/user_service'

import { inject } from '@adonisjs/core'
import { Bouncer } from '@adonisjs/bouncer'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Creates the Bouncer instance for the signed-in staff User. Bouncer is
 * back-office only, so Customers always resolve to a guest.
 */
@inject()
export default class InitializeBouncerMiddleware {
  constructor(protected userService: UserService) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.use('web').user ?? null
    if (user) {
      await this.userService.loadRole(user)
    }

    ctx.bouncer = new Bouncer<User, typeof abilities, typeof policies>(
      () => user,
      abilities,
      policies
    ).setContainerResolver(ctx.containerResolver)

    if ('view' in ctx) {
      ctx.view.share(ctx.bouncer.edgeHelpers)
    }

    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    bouncer: Bouncer<User, typeof abilities, typeof policies>
  }
}
