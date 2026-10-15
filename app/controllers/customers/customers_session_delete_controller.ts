import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ImpersonationService from '#services/impersonation_service'
import { CUSTOMER_SESSION_VERSION_KEY } from '#utils/customer_session'

@inject()
export default class CustomersSessionDeleteController {
  constructor(protected impersonationService: ImpersonationService) {}

  async handle(ctx: HttpContext) {
    const { auth, response, session } = ctx
    const impersonatedCustomerId = await this.impersonationService.stop(ctx)
    if (impersonatedCustomerId) {
      return response.ok({
        data: { redirectTo: `/admin/customers/edit/${impersonatedCustomerId}` },
      })
    }

    await auth.use('customer').logout()
    session.forget(CUSTOMER_SESSION_VERSION_KEY)
    session.regenerate()
    return response.ok({ data: { redirectTo: '/' } })
  }
}
