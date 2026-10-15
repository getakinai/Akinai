import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { ADMIN_EVENT_RETENTION_DAYS } from '#constants/admin_events'

export default class PruneAdminEvents extends BaseCommand {
  static commandName = 'admin_events:prune'
  static description = `Delete admin notification events older than ${ADMIN_EVENT_RETENTION_DAYS} days`

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: AdminEventService } = await import('#services/admin_event_service')
    const service = await this.app.container.make(AdminEventService)
    const deleted = await service.prune()
    this.logger.success(`Deleted ${deleted} admin event(s)`)
  }
}
