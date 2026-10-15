import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { ANALYTICS_EVENT_RETENTION_MONTHS } from '#constants/analytics'

export default class PruneAnalyticsEvents extends BaseCommand {
  static commandName = 'analytics:prune'
  static description = `Delete storefront analytics events older than ${ANALYTICS_EVENT_RETENTION_MONTHS} months`

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: AnalyticsTrackingService } =
      await import('#services/analytics_tracking_service')
    const service = await this.app.container.make(AnalyticsTrackingService)
    const deleted = await service.prune()
    this.logger.success(`Deleted ${deleted} analytics event(s)`)
  }
}
