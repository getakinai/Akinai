import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_EMAILS_SORT_KEYS = ['createdAt', 'subject', 'type', 'status'] as const

export const AdminEmailsSortKeySchema = z.enum(ADMIN_EMAILS_SORT_KEYS)

export type AdminEmailsSortKey = z.infer<typeof AdminEmailsSortKeySchema>

export const EMAIL_STATUSES = ['queued', 'sent', 'failed'] as const

export const EmailStatusSchema = z.enum(EMAIL_STATUSES)

export type EmailStatus = z.infer<typeof EmailStatusSchema>

export const EmailStatusFilterSchema = z.enum(['', ...EMAIL_STATUSES])

export type EmailStatusFilter = z.infer<typeof EmailStatusFilterSchema>

export const EMAIL_TYPES = [
  'customer_signup_code',
  'customer_password_reset_code',
  'customer_password_changed',
  'customer_account_exists',
  'customer_email_changed',
  'order_confirmation',
  'order_payment_received',
  'order_shipped',
  'order_shipping_updated',
  'order_cancelled',
  'order_refunded',
  'order_note_added',
  'order_payment_rejected',
  'return_requested',
  'return_approved',
  'return_declined',
  'staff_order_placed',
  'staff_return_requested',
  'staff_payment_submitted',
  'staff_order_note_replied',
  'support_ticket_received',
  'support_ticket_replied',
  'staff_support_ticket_created',
  'staff_support_ticket_replied',
  'other',
] as const

export const EmailTypeSchema = z.enum(EMAIL_TYPES)

export type EmailType = z.infer<typeof EmailTypeSchema>

export const EmailTypeFilterSchema = z.enum(['', ...EMAIL_TYPES])

export type EmailTypeFilter = z.infer<typeof EmailTypeFilterSchema>

export const AdminEmailListItemSchema = z.object({
  id: z.uuid(),
  type: EmailTypeSchema.catch('other'),
  subject: z.string(),
  toAddresses: z.array(z.string()),
  status: EmailStatusSchema,
  error: z.string().nullable(),
  redacted: z.boolean(),
  sentAt: z.string().nullable(),
  orderId: z.uuid().nullable(),
  customerId: z.uuid().nullable(),
  resentFromId: z.uuid().nullable(),
  createdAt: z.string(),
})

export type AdminEmailListItem = z.infer<typeof AdminEmailListItemSchema>

export const AdminEmailDetailSchema = AdminEmailListItemSchema.extend({
  fromAddress: z.string().nullable(),
  ccAddresses: z.array(z.string()),
  bccAddresses: z.array(z.string()),
  html: z.string().nullable(),
  text: z.string().nullable(),
  providerMessageId: z.string().nullable(),
})

export type AdminEmailDetail = z.infer<typeof AdminEmailDetailSchema>

export const AdminEmailsListQuerySchema = z.object({
  q: z.string().optional(),
  status: EmailStatusFilterSchema.optional(),
  type: EmailTypeFilterSchema.optional(),
  orderId: z.uuid().optional(),
  customerId: z.uuid().optional(),
  sort: AdminEmailsSortKeySchema.optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminEmailsListQuery = z.infer<typeof AdminEmailsListQuerySchema>

export const AdminEmailsListResponseSchema = paginatedResponse(AdminEmailListItemSchema)

export const AdminEmailResponseSchema = z.object({ data: AdminEmailDetailSchema })

export const AdminEmailResendResponseSchema = z.object({ data: z.object({ queued: z.boolean() }) })
