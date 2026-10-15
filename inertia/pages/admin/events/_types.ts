import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import {
  ADMIN_EVENT_TYPES,
  AdminEventActorTypeSchema,
  AdminEventTypeSchema,
} from '../_notification_types'

export { ADMIN_EVENT_TYPES }

export const ADMIN_EVENTS_SORT_KEYS = ['createdAt'] as const

export type AdminEventsSortKey = (typeof ADMIN_EVENTS_SORT_KEYS)[number]

export const ADMIN_EVENT_STATUSES = ['pending', 'delivered', 'failed'] as const

export const AdminEventStatusSchema = z.enum(ADMIN_EVENT_STATUSES)

export type AdminEventStatus = z.infer<typeof AdminEventStatusSchema>

export const AdminEventStatusFilterSchema = z.enum(['', ...ADMIN_EVENT_STATUSES])

export type AdminEventStatusFilter = z.infer<typeof AdminEventStatusFilterSchema>

export const AdminEventTypeFilterSchema = z.enum(['', ...ADMIN_EVENT_TYPES])

export type AdminEventTypeFilter = z.infer<typeof AdminEventTypeFilterSchema>

const ChangeValuesSchema = z.record(z.string(), z.unknown())

export const AdminEventSchema = z.object({
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
  channel: z.string(),
  details: z.object({
    before: ChangeValuesSchema.nullable().optional(),
    after: ChangeValuesSchema.nullable().optional(),
    currencyCode: z.string().nullable().optional(),
  }),
  status: AdminEventStatusSchema,
  attempts: z.number().int(),
  lastError: z.string().nullable(),
  deliveredAt: z.string().nullable(),
})

export type AdminEvent = z.infer<typeof AdminEventSchema>

export const AdminEventsListQuerySchema = z.object({
  q: z.string().optional(),
  status: AdminEventStatusFilterSchema.optional(),
  type: AdminEventTypeFilterSchema.optional(),
  sort: z.enum(ADMIN_EVENTS_SORT_KEYS).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminEventsListQuery = z.infer<typeof AdminEventsListQuerySchema>

export const AdminEventsListResponseSchema = paginatedResponse(AdminEventSchema)

export const AdminEventResponseSchema = z.object({ data: AdminEventSchema })

export const AdminEventsRetryFailedResponseSchema = z.object({
  data: z.object({ retried: z.number().int(), delivered: z.number().int() }),
})
