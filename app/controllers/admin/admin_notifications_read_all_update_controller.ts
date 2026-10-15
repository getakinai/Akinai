import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'

/** Marks every notification the user can see as read. No body. */
@inject()
export default class AdminNotificationsReadAllUpdateController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle(ctx: HttpContext) {
    const updated = await this.adminEventService.markAllRead(ctx.auth.use('web').getUserOrFail())
    return { data: { updated } }
  }
}
