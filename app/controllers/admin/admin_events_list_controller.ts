import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'
import AdminEventTransformer from '#transformers/admin_event_transformer'
import { adminEventsListQueryValidator } from '#validators/admin_events_list_query_validator'

@inject()
export default class AdminEventsListController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminEventsListQueryValidator, {
      data: ctx.request.qs(),
    })
    const events = await this.adminEventService.paginate(filters)
    return ctx.serialize(AdminEventTransformer.paginate(events.all(), events.getMeta()))
  }
}
