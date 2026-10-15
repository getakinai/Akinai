import vine from '@vinejs/vine'
import { SUPPORT_TICKET_STATUSES } from '#constants/support'

export const adminSupportTicketUpdateValidator = vine.create({
  status: vine.enum(SUPPORT_TICKET_STATUSES).optional(),
  assignedUserId: vine.string().uuid().nullable().optional(),
})
