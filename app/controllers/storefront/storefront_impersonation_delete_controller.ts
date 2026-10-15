import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ImpersonationService from '#services/impersonation_service'

@inject()
export default class StorefrontImpersonationDeleteController {
  constructor(protected impersonationService: ImpersonationService) {}

  async handle(ctx: HttpContext) {
    const customerId = await this.impersonationService.stop(ctx)
    const redirectTo = customerId ? `/admin/customers/edit/${customerId}` : '/admin/customers'
    return ctx.response.ok({ data: { redirectTo } })
  }
}
