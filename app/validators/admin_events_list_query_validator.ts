import vine from '@vinejs/vine'
import { ADMIN_EVENT_STATUSES, ADMIN_EVENT_TYPES } from '#constants/admin_events'
import { listQuerySchema } from '#validators/helpers/list_query'

export const adminEventsListQueryValidator = vine.create({
  ...listQuerySchema(['createdAt'] as const),
  type: vine.enum(ADMIN_EVENT_TYPES).optional(),
  status: vine.enum(ADMIN_EVENT_STATUSES).optional(),
})
