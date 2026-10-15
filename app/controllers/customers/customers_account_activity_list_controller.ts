import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import CustomerActivityTransformer from '#transformers/customer_activity_transformer'
import { customersAccountActivityListQueryValidator } from '#validators/customers_account_activity_list_query_validator'

@inject()
export default class CustomersAccountActivityListController {
  constructor(protected auditLogService: AuditLogService) {}

  async handle(ctx: HttpContext) {
    const { page, perPage } = await ctx.request.validateUsing(
      customersAccountActivityListQueryValidator,
      { data: ctx.request.qs() }
    )
    const account = ctx.auth.use('customer').getUserOrFail()
    const logs = await this.auditLogService.paginateForCustomer(account.customerId, {
      page,
      perPage,
    })

    return ctx.serialize(CustomerActivityTransformer.paginate(logs.all(), logs.getMeta()))
  }
}
