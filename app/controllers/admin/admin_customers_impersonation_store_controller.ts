import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerService from '#services/customer_service'
import ImpersonationService from '#services/impersonation_service'
import { adminCustomerImpersonationStoreValidator } from '#validators/admin_customer_impersonation_store_validator'

@inject()
export default class AdminCustomersImpersonationStoreController {
  constructor(
    protected customerService: CustomerService,
    protected impersonationService: ImpersonationService
  ) {}

  async handle(ctx: HttpContext) {
    const { reason } = await ctx.request.validateUsing(adminCustomerImpersonationStoreValidator)
    const staff = ctx.auth.use('web').getUserOrFail()

    const customer = await this.customerService.findOrFail(ctx.params.id)
    const account = await this.impersonationService.findAccount(customer.id)
    await ctx.bouncer.with(CustomerPolicy).authorize('impersonate', customer, account)
    if (!account) {
      return ctx.response.unprocessableEntity({ error: 'This customer has no storefront account' })
    }

    await this.impersonationService.start(ctx, staff, customer, account, reason)
    return ctx.response.ok({ data: { redirectTo: '/account' } })
  }
}
