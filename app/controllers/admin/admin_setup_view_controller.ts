import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SetupService from '#services/setup_service'
import SetupStatusTransformer from '#transformers/setup_status_transformer'

@inject()
export default class AdminSetupViewController {
  constructor(protected setupService: SetupService) {}

  async handle(ctx: HttpContext) {
    const status = await this.setupService.status()
    return ctx.serialize(SetupStatusTransformer.transform(status))
  }
}
