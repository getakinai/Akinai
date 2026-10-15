import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MaintenanceService from '#services/maintenance_service'
import MaintenanceTransformer from '#transformers/maintenance_transformer'

@inject()
export default class AdminMaintenanceViewController {
  constructor(protected maintenanceService: MaintenanceService) {}

  async handle(ctx: HttpContext) {
    const status = await this.maintenanceService.status()
    return ctx.serialize(MaintenanceTransformer.transform(status))
  }
}
