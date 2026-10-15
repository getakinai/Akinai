import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'
import { EMAIL_LOG_STATUSES } from '#models/email_log'
import { EMAIL_TYPES } from '#constants/email_logs'

export const ADMIN_EMAILS_SORT_KEYS = ['createdAt', 'subject', 'type', 'status'] as const

export const adminEmailsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_EMAILS_SORT_KEYS),
  status: vine.enum(EMAIL_LOG_STATUSES).optional(),
  type: vine.enum(EMAIL_TYPES).optional(),
  orderId: vine.string().uuid().optional(),
  customerId: vine.string().uuid().optional(),
})
