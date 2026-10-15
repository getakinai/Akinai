import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { EMAIL_LOG_RETENTION_DAYS } from '#constants/email_logs'

export default class PruneEmailLogs extends BaseCommand {
  static commandName = 'emails:prune'
  static description = `Delete email logs older than ${EMAIL_LOG_RETENTION_DAYS} days`

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: EmailLogService } = await import('#services/email_log_service')
    const service = await this.app.container.make(EmailLogService)
    const deleted = await service.prune()
    this.logger.success(`Deleted ${deleted} email log(s)`)
  }
}
