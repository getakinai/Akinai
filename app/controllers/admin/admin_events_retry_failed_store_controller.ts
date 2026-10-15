import { inject } from '@adonisjs/core'
import AdminEventService from '#services/admin_event_service'

/** Re-sends the oldest failed events (capped per call). No body. */
@inject()
export default class AdminEventsRetryFailedStoreController {
  constructor(protected adminEventService: AdminEventService) {}

  async handle() {
    const result = await this.adminEventService.retryFailed()
    return { data: result }
  }
}
