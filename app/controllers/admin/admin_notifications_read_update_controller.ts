import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'

/** Marks one notification read. 404 when the user can't see it. No body. */
@inject()
export default class AdminNotificationsReadUpdateController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    const found = await this.adminEventService.markRead(user, ctx.params.id)
    if (!found) return ctx.response.notFound({ errors: [{ message: 'Notification not found' }] })
    return { data: { read: true } }
  }
}
