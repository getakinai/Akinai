import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const SUPPORT_TICKET_STATUSES = ['open', 'pending_customer', 'closed'] as const

export const SupportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUSES)

export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>

export const SupportTicketStatusFilterSchema = z.enum(['', ...SUPPORT_TICKET_STATUSES])

export type SupportTicketStatusFilter = z.infer<typeof SupportTicketStatusFilterSchema>

export const SupportTicketAssignedFilterSchema = z.enum(['', 'me', 'unassigned'])

export type SupportTicketAssignedFilter = z.infer<typeof SupportTicketAssignedFilterSchema>

export const ADMIN_SUPPORT_TICKETS_SORT_KEYS = ['lastMessageAt', 'createdAt', 'number'] as const

export const AdminSupportTicketsSortKeySchema = z.enum(ADMIN_SUPPORT_TICKETS_SORT_KEYS)

export type AdminSupportTicketsSortKey = z.infer<typeof AdminSupportTicketsSortKeySchema>

const PersonSchema = z.object({ id: z.uuid(), name: z.string() })

export const AdminSupportTicketSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  fullName: z.string(),
  email: z.string(),
  mobile: z.string(),
  status: SupportTicketStatusSchema,
  customerId: z.uuid().nullable(),
  assignedUser: PersonSchema.nullable(),
  lastMessageAt: z.string(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
})

export type AdminSupportTicket = z.infer<typeof AdminSupportTicketSchema>

export const AdminSupportMessageSchema = z.object({
  id: z.uuid(),
  authorType: z.enum(['customer', 'staff']),
  authorName: z.string(),
  isInternal: z.boolean(),
  body: z.string(),
  createdAt: z.string(),
})

export type AdminSupportMessage = z.infer<typeof AdminSupportMessageSchema>

export const AdminSupportThreadSchema = z.object({
  ticket: AdminSupportTicketSchema.extend({
    customer: PersonSchema.nullable(),
    chatTranscript: z.array(z.string()),
  }),
  messages: z.array(AdminSupportMessageSchema),
})

export type AdminSupportThread = z.infer<typeof AdminSupportThreadSchema>

export const AdminSupportThreadResponseSchema = z.object({ data: AdminSupportThreadSchema })

export const AdminSupportTicketsListQuerySchema = z.object({
  q: z.string().optional(),
  status: SupportTicketStatusFilterSchema.optional(),
  assigned: SupportTicketAssignedFilterSchema.optional(),
  sort: AdminSupportTicketsSortKeySchema.optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminSupportTicketsListQuery = z.infer<typeof AdminSupportTicketsListQuerySchema>

export const AdminSupportTicketsListResponseSchema = paginatedResponse(AdminSupportTicketSchema)

export const AdminSupportAssigneesResponseSchema = z.object({ data: z.array(PersonSchema) })

export const AdminSupportOpenCountResponseSchema = z.object({
  data: z.object({ open: z.number().int().min(0) }),
})

export const AdminSupportReplyFormSchema = z.object({
  body: z.string().trim().min(1, 'Write a reply first').max(5000),
  isInternal: z.boolean(),
})

export type AdminSupportReplyForm = z.infer<typeof AdminSupportReplyFormSchema>

export type AdminSupportTicketUpdate = {
  status?: SupportTicketStatus
  assignedUserId?: string | null
}

export type AdminSupportBulkStatusPayload = { ids: string[]; status: 'open' | 'closed' }
