import vine from '@vinejs/vine'
import { SUPPORT_TICKET_STATUSES } from '#constants/support'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_SUPPORT_TICKETS_SORT_KEYS = ['lastMessageAt', 'createdAt', 'number'] as const

export const adminSupportTicketsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_SUPPORT_TICKETS_SORT_KEYS),
  status: vine.enum(SUPPORT_TICKET_STATUSES).optional(),
  assigned: vine.enum(['me', 'unassigned'] as const).optional(),
})
