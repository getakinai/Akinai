import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { errors } from '@adonisjs/lucid'
import type { CustomerOwnedResource } from '#repositories/customer_ownership_repository'
import CustomerOwnershipService from '#services/customer_ownership_service'

/**
 * Lets the request through only when the `:id` record belongs to the
 * signed-in customer. Use after `auth({ guards: ['customer'] })`:
 * `.use(middleware.customerOwns({ resource: 'address' }))`
 *
 * Responds 404, not 403, so other customers' ids are not revealed.
 */
@inject()
export default class CustomerOwnsMiddleware {
  constructor(protected customerOwnershipService: CustomerOwnershipService) {}

  async handle(ctx: HttpContext, next: NextFn, options: { resource: CustomerOwnedResource }) {
    const account = ctx.auth.use('customer').getUserOrFail()
    const id = ctx.params.id

    if (
      typeof id !== 'string' ||
      !(await this.customerOwnershipService.accountOwns(account, options.resource, id))
    ) {
      throw new errors.E_ROW_NOT_FOUND()
    }

    return next()
  }
}
