import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'
import AdminEventTransformer from '#transformers/admin_event_transformer'

@inject()
export default class AdminEventsViewController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle(ctx: HttpContext) {
    const event = await this.adminEventService.findOrFail(ctx.params.id)
    return ctx.serialize(AdminEventTransformer.transform(event))
  }
}
