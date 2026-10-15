import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class PruneVerificationCodes extends BaseCommand {
  static commandName = 'customers:prune-verification-codes'
  static description =
    'Delete signup and password reset codes that expired or were used over a day ago'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: CustomerVerificationCodeService } =
      await import('#services/customer_verification_code_service')
    const service = await this.app.container.make(CustomerVerificationCodeService)
    const deleted = await service.deleteExpired()
    this.logger.success(`Deleted ${deleted} verification code(s)`)
  }
}
