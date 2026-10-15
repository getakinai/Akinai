import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import OrderService from '#services/order_service'
import RecordActivityTransformer from '#transformers/record_activity_transformer'
import { adminOrderActivityListQueryValidator } from '#validators/admin_order_activity_list_query_validator'

@inject()
export default class AdminOrderActivityListController {
  constructor(
    protected orderService: OrderService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminOrderActivityListQueryValidator, {
      data: ctx.request.qs(),
    })
    const order = await this.orderService.findOrFail(ctx.params.id)
    const logs = await this.auditLogService.paginateForRecord('Order', order.id, filters)

    return ctx.serialize(RecordActivityTransformer.paginate(logs.all(), logs.getMeta()))
  }
}
