import { z } from 'zod'

export const MAX_SUPPORT_MESSAGE_LENGTH = 5000
export const MAX_SUPPORT_CHAT_QUESTION_LENGTH = 200
export const MAX_SUPPORT_TRANSCRIPT_ENTRIES = 10

export const SupportTicketStatusSchema = z.enum(['open', 'pending_customer', 'closed'])

export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>

export const SupportChatIntentSchema = z.enum([
  'greeting',
  'thanks',
  'goodbye',
  'human',
  'order_status',
  'answer',
  'unsure',
  'no_match',
])

export const SupportChatLinkSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  href: z.string(),
})

export type SupportChatLink = z.infer<typeof SupportChatLinkSchema>

export const SupportChatReplySchema = z.object({
  intent: SupportChatIntentSchema,
  messages: z.array(z.string()),
  links: z.array(SupportChatLinkSchema),
  suggestions: z.array(z.string()),
  offerHandoff: z.boolean(),
})

export type SupportChatReply = z.infer<typeof SupportChatReplySchema>

export const SupportChatReplyResponseSchema = z.object({ data: SupportChatReplySchema })

/** Mobile numbers: digits with optional leading +, spaces, dashes and brackets. */
const MOBILE_PATTERN = /^\+?[0-9][0-9\s()-]{6,18}$/

export const SupportFullNameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your full name')
  .max(120, 'That name is too long')

export const SupportMobileSchema = z
  .string()
  .trim()
  .regex(MOBILE_PATTERN, 'Please enter a valid mobile number, like +63 917 123 4567')

export const SupportEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Please enter a valid email address').max(254))

export const SupportConcernSchema = z
  .string()
  .trim()
  .min(10, 'Please add a little more detail (at least 10 characters)')
  .max(MAX_SUPPORT_MESSAGE_LENGTH)

/** Contact fields are left out when the signed-in customer's account covers them. */
export const SupportTicketFormSchema = z.object({
  fullName: SupportFullNameSchema.optional(),
  mobile: SupportMobileSchema.optional(),
  email: SupportEmailSchema.optional(),
  concern: SupportConcernSchema,
  transcript: z.array(z.string().max(200)).max(MAX_SUPPORT_TRANSCRIPT_ENTRIES),
})

export type SupportTicketForm = z.infer<typeof SupportTicketFormSchema>

export const SupportTicketCreatedResponseSchema = z.object({
  data: z.object({
    reference: z.string(),
    email: z.string(),
    accountTicketId: z.uuid().nullable(),
  }),
})

export type SupportTicketCreated = z.infer<typeof SupportTicketCreatedResponseSchema>['data']

export const SupportMessageSchema = z.object({
  id: z.uuid(),
  fromCustomer: z.boolean(),
  staffName: z.string().nullable(),
  body: z.string(),
  createdAt: z.string(),
})

export type SupportMessage = z.infer<typeof SupportMessageSchema>

export const PublicSupportThreadSchema = z.object({
  ticket: z.object({
    reference: z.string(),
    status: SupportTicketStatusSchema,
    fullName: z.string(),
    lastMessageAt: z.string(),
    createdAt: z.string(),
  }),
  messages: z.array(SupportMessageSchema),
})

export type PublicSupportThread = z.infer<typeof PublicSupportThreadSchema>

export const PublicSupportThreadResponseSchema = z.object({ data: PublicSupportThreadSchema })

export const SupportReplyFormSchema = z.object({
  body: z.string().trim().min(1, 'Write a message first').max(MAX_SUPPORT_MESSAGE_LENGTH),
})

export type SupportReplyForm = z.infer<typeof SupportReplyFormSchema>

export const SupportReplySentResponseSchema = z.object({ data: z.object({ sent: z.boolean() }) })
