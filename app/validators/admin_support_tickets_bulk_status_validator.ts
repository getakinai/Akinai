import vine from '@vinejs/vine'
import { bulkIdsSchema } from '#validators/helpers/bulk_ids'

/** Close or reopen many support tickets. */
export const adminSupportTicketsBulkStatusValidator = vine.create({
  ids: bulkIdsSchema(),
  status: vine.enum(['open', 'closed'] as const),
})
