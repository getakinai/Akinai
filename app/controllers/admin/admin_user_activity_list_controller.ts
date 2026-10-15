import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import UserService from '#services/user_service'
import AuditLogTransformer from '#transformers/audit_log_transformer'
import { adminUserActivityListQueryValidator } from '#validators/admin_user_activity_list_query_validator'

@inject()
export default class AdminUserActivityListController {
  constructor(
    protected userService: UserService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminUserActivityListQueryValidator, {
      data: ctx.request.qs(),
    })
    const user = await this.userService.findOrFail(ctx.params.id)
    const logs = await this.auditLogService.paginateForUser(user.id, filters)

    return ctx.serialize(AuditLogTransformer.paginate(logs.all(), logs.getMeta()))
  }
}
