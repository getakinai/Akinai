import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MaintenanceService from '#services/maintenance_service'
import MaintenanceTransformer from '#transformers/maintenance_transformer'
import { adminMaintenanceUpdateValidator } from '#validators/admin_maintenance_update_validator'

@inject()
export default class AdminMaintenanceUpdateController {
  constructor(protected maintenanceService: MaintenanceService) {}

  async handle(ctx: HttpContext) {
    const { active } = await ctx.request.validateUsing(adminMaintenanceUpdateValidator)
    const status = await this.maintenanceService.setActive(
      active,
      ctx.auth.use('web').getUserOrFail(),
      ctx.request.ip()
    )
    return ctx.serialize(MaintenanceTransformer.transform(status))
  }
}
