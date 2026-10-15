import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'
import AdminEventTransformer from '#transformers/admin_event_transformer'
import { adminNotificationsListQueryValidator } from '#validators/admin_notifications_list_query_validator'

@inject()
export default class AdminNotificationsListController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle(ctx: HttpContext) {
    const query = await ctx.request.validateUsing(adminNotificationsListQueryValidator, {
      data: ctx.request.qs(),
    })
    const user = ctx.auth.use('web').getUserOrFail()
    const { events, badge, seenAt } = await this.adminEventService.notifications(user, query)
    return ctx.serialize(
      AdminEventTransformer.paginate(events.all(), {
        ...events.getMeta(),
        badge,
        seenAt: seenAt?.toISO() ?? null,
      }).useVariant('toNotification')
    )
  }
}
