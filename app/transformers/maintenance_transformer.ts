import { BaseTransformer } from '@adonisjs/core/transformers'
import type { MaintenanceStatus } from '#services/maintenance_service'

export default class MaintenanceTransformer extends BaseTransformer<MaintenanceStatus> {
  toObject() {
    return { active: this.resource.active }
  }
}
