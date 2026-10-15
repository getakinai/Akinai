import type { Permission } from '#abilities/permissions'

/** Redis pub/sub channel every web instance listens on. */
export const ADMIN_EVENTS_REDIS_CHANNEL = 'admin:events'

/** Transmit (SSE) channels browsers subscribe to, and who may subscribe. */
export const ADMIN_EVENT_CHANNELS = {
  'admin/orders': 'orders.view',
  'admin/support': 'support_tickets.view',
} as const satisfies Record<string, Permission>

export type AdminEventChannel = keyof typeof ADMIN_EVENT_CHANNELS

/** One staff user's product import progress; only that user may subscribe. */
export const PRODUCT_IMPORT_CHANNEL_PATTERN = 'admin/product-imports/:userId'

export type ProductImportChannel = `admin/product-imports/${string}`

export const productImportChannel = (userId: string): ProductImportChannel =>
  `admin/product-imports/${userId}`

export const PRODUCT_IMPORT_CHANNEL_REGEX = /^admin\/product-imports\/[0-9a-f-]{36}$/

/** Least time between two progress messages for one import. */
export const PRODUCT_IMPORT_PROGRESS_INTERVAL_MS = 250

export const ADMIN_EVENT_TYPES = [
  'order.placed',
  'order.paid',
  'order.payment_submitted',
  'order.payment_status_changed',
  'order.fulfillment_status_changed',
  'order.fulfilled',
  'order.fulfillment_cancelled',
  'order.cancelled',
  'order.refunded',
  'order.note_replied',
  'return.requested',
  'return.approved',
  'return.declined',
  'return.received',
  'return.cancelled',
  'support.ticket_created',
  'support.ticket_replied',
] as const

export type AdminEventType = (typeof ADMIN_EVENT_TYPES)[number]

export const ADMIN_EVENT_STATUSES = ['pending', 'delivered', 'failed'] as const

export type AdminEventStatus = (typeof ADMIN_EVENT_STATUSES)[number]

export const ADMIN_EVENT_ACTOR_TYPES = ['user', 'customer', 'system'] as const

export type AdminEventActorType = (typeof ADMIN_EVENT_ACTOR_TYPES)[number]

/** Days admin events are kept (`node ace admin_events:prune`). */
export const ADMIN_EVENT_RETENTION_DAYS = 90

/** Give up on a Redis publish after this long and mark the event failed. */
export const ADMIN_EVENT_PUBLISH_TIMEOUT_MS = 3000

/** Most failed events one "Retry failed" click re-sends. */
export const ADMIN_EVENT_RETRY_BATCH = 100
