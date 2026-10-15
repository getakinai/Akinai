import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminEventService from '#services/admin_event_service'
import AuditLogService from '#services/audit_log_service'
import AdminEventTransformer from '#transformers/admin_event_transformer'

/** Re-sends one event to connected staff. No body. */
@inject()
export default class AdminEventsRetryStoreController {
  constructor(
    protected adminEventService: AdminEventService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const event = await this.adminEventService.findOrFail(ctx.params.id)
    const updated = await this.adminEventService.retry(event)
    await this.auditLogService.recordStaffEvent(
      { type: 'AdminEvent', id: event.id, label: event.title },
      'resent',
      { status: updated.status, attempts: updated.attempts }
    )
    return ctx.serialize(AdminEventTransformer.transform(updated))
  }
}
