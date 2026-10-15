/** Open: waiting on staff. Pending customer: staff replied. Closed: resolved. */
export const SUPPORT_TICKET_STATUSES = ['open', 'pending_customer', 'closed'] as const

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number]

export const SUPPORT_MESSAGE_AUTHOR_TYPES = ['customer', 'staff'] as const

export type SupportMessageAuthorType = (typeof SUPPORT_MESSAGE_AUTHOR_TYPES)[number]

export const SUPPORT_REFERENCE_PREFIX = 'SR-'

/** First ticket number, so references don't start at SR-1. */
export const FIRST_SUPPORT_TICKET_NUMBER = 1001

export const MAX_SUPPORT_MESSAGE_LENGTH = 5000

/** Chat questions attached to a new ticket, and the length of each. */
export const MAX_SUPPORT_TRANSCRIPT_ENTRIES = 10
export const MAX_SUPPORT_TRANSCRIPT_ENTRY_LENGTH = 200

/** Messages one thread can hold, so a leaked link can't be used to flood the inbox. */
export const MAX_SUPPORT_MESSAGES_PER_TICKET = 200

/** Days the emailed thread link works. Every staff reply extends it. */
export const SUPPORT_ACCESS_TOKEN_DAYS = 30

/** Raw thread link token: 32 random bytes as base64url. */
export const SUPPORT_ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const MAX_SUPPORT_CHAT_QUESTION_LENGTH = 200

/** Loose mobile number check (digits, spaces, dashes, brackets, optional leading +). */
export const SUPPORT_MOBILE_PATTERN = /^\+?[0-9][0-9\s()-]{6,18}$/
