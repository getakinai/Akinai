import { z } from 'zod'
import { PaginationMetaSchema } from '~/lib/schemas'

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

export const AdminEventTypeSchema = z.enum(ADMIN_EVENT_TYPES)

export type AdminEventType = z.infer<typeof AdminEventTypeSchema>

export const AdminEventActorTypeSchema = z.enum(['user', 'customer', 'system'])

/** What arrives over SSE for a new event. */
export const LiveAdminEventSchema = z.object({
  id: z.uuid(),
  type: AdminEventTypeSchema,
  title: z.string(),
  subjectType: z.string(),
  subjectId: z.uuid(),
  subjectLabel: z.string().nullable(),
  orderId: z.uuid().nullable(),
  actorType: AdminEventActorTypeSchema,
  actorLabel: z.string().nullable(),
  createdAt: z.string(),
})

export type LiveAdminEvent = z.infer<typeof LiveAdminEventSchema>

export const AdminNotificationSchema = LiveAdminEventSchema.extend({ read: z.boolean() })

export type AdminNotification = z.infer<typeof AdminNotificationSchema>

export const NOTIFICATION_FILTERS = ['all', 'unread'] as const

export const NotificationFilterSchema = z.enum(NOTIFICATION_FILTERS)

export type NotificationFilter = z.infer<typeof NotificationFilterSchema>

export const AdminNotificationsResponseSchema = z.object({
  data: z.array(AdminNotificationSchema),
  metadata: PaginationMetaSchema.extend({
    badge: z.number().int().min(0),
    seenAt: z.string().nullable(),
  }),
})

export type AdminNotificationsPage = z.infer<typeof AdminNotificationsResponseSchema>

export const NotificationsSeenResponseSchema = z.object({
  data: z.object({ seenAt: z.string() }),
})

export const NotificationReadResponseSchema = z.object({ data: z.object({ read: z.boolean() }) })

export const NotificationsReadAllResponseSchema = z.object({
  data: z.object({ updated: z.number().int() }),
})
