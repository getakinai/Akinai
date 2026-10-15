import { z } from 'zod'
import { SupportChatLinkSchema } from '~/pages/support/_types'

export const HANDOFF_STEPS = ['fullName', 'mobile', 'email', 'concern'] as const

export type HandoffStep = (typeof HANDOFF_STEPS)[number]

const EntryBase = z.object({ id: z.string(), at: z.string() })

export const ChatEntrySchema = z.discriminatedUnion('kind', [
  EntryBase.extend({
    kind: z.literal('text'),
    role: z.enum(['bot', 'user']),
    text: z.string(),
    /** Contact details typed during the handoff, never saved to sessionStorage. */
    private: z.boolean().optional(),
  }),
  EntryBase.extend({ kind: z.literal('links'), links: z.array(SupportChatLinkSchema) }),
  EntryBase.extend({
    kind: z.literal('sent'),
    reference: z.string(),
    email: z.string(),
    accountTicketId: z.uuid().nullable(),
  }),
])

export type ChatEntry = z.infer<typeof ChatEntrySchema>

export const ChipSchema = z.object({
  label: z.string(),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('ask'), text: z.string() }),
    z.object({ type: z.literal('helped') }),
    z.object({ type: z.literal('not_quite') }),
    z.object({ type: z.literal('handoff') }),
    z.object({ type: z.literal('cancel_handoff') }),
  ]),
})

export type Chip = z.infer<typeof ChipSchema>

export type ChipAction = Chip['action']

/** What survives a page change in the same tab (no contact details). */
export const StoredChatSchema = z.object({
  entries: z.array(ChatEntrySchema).max(60),
  chips: z.array(ChipSchema).max(8),
  questions: z.array(z.string()).max(10),
  misses: z.number().int().min(0),
})

export type StoredChat = z.infer<typeof StoredChatSchema>
