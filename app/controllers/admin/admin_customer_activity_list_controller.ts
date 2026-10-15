import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import CustomerService from '#services/customer_service'
import RecordActivityTransformer from '#transformers/record_activity_transformer'
import { adminCustomerActivityListQueryValidator } from '#validators/admin_customer_activity_list_query_validator'

@inject()
export default class AdminCustomerActivityListController {
  constructor(
    protected customerService: CustomerService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminCustomerActivityListQueryValidator, {
      data: ctx.request.qs(),
    })
    const customer = await this.customerService.findOrFail(ctx.params.id)
    const logs = await this.auditLogService.paginateCustomerHistory(customer.id, filters)

    return ctx.serialize(RecordActivityTransformer.paginate(logs.all(), logs.getMeta()))
  }
}
