import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import { SupportMessageSchema, SupportTicketStatusSchema } from '~/pages/support/_types'

export const CustomerSupportTicketSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  status: SupportTicketStatusSchema,
  lastMessageAt: z.string(),
  createdAt: z.string(),
})

export type CustomerSupportTicket = z.infer<typeof CustomerSupportTicketSchema>

export const CustomerSupportTicketsResponseSchema = paginatedResponse(CustomerSupportTicketSchema)

export const CustomerSupportThreadSchema = z.object({
  ticket: CustomerSupportTicketSchema.extend({ fullName: z.string() }),
  messages: z.array(SupportMessageSchema),
})

export type CustomerSupportThread = z.infer<typeof CustomerSupportThreadSchema>

export const CustomerSupportThreadResponseSchema = z.object({ data: CustomerSupportThreadSchema })
