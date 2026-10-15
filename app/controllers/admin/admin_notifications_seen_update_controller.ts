import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'

/** Opening the bell panel: resets the badge. No body. */
@inject()
export default class AdminNotificationsSeenUpdateController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle(ctx: HttpContext) {
    const seenAt = await this.adminEventService.markSeen(ctx.auth.use('web').getUserOrFail())
    return { data: { seenAt: seenAt.toISO() } }
  }
}
