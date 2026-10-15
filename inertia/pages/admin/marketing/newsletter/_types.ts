import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_NEWSLETTER_SUBSCRIBERS_SORT_KEYS = ['email', 'subscribedAt'] as const

export const AdminNewsletterSubscribersSortKeySchema = z.enum(
  ADMIN_NEWSLETTER_SUBSCRIBERS_SORT_KEYS
)

export type AdminNewsletterSubscribersSortKey = z.infer<
  typeof AdminNewsletterSubscribersSortKeySchema
>

export const NEWSLETTER_SOURCES = ['footer', 'maintenance'] as const

export const AdminNewsletterStatusFilterSchema = z.enum(['', 'subscribed', 'unsubscribed'])

export type AdminNewsletterStatusFilter = z.infer<typeof AdminNewsletterStatusFilterSchema>

export const AdminNewsletterSourceFilterSchema = z.enum(['', ...NEWSLETTER_SOURCES])

export type AdminNewsletterSourceFilter = z.infer<typeof AdminNewsletterSourceFilterSchema>

export const AdminNewsletterSubscriberSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  source: z.enum(NEWSLETTER_SOURCES),
  isSubscribed: z.boolean(),
  subscribedAt: z.string(),
  unsubscribedAt: z.string().nullable(),
})

export type AdminNewsletterSubscriber = z.infer<typeof AdminNewsletterSubscriberSchema>

export const AdminNewsletterSubscribersListQuerySchema = z.object({
  q: z.string(),
  status: AdminNewsletterStatusFilterSchema,
  source: AdminNewsletterSourceFilterSchema,
  sort: AdminNewsletterSubscribersSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminNewsletterSubscribersListQuery = z.infer<
  typeof AdminNewsletterSubscribersListQuerySchema
>

export const AdminNewsletterSubscribersListResponseSchema = paginatedResponse(
  AdminNewsletterSubscriberSchema
)

export const AdminNewsletterBulkSubscriptionSchema = z.object({
  ids: z.array(z.uuid()),
  subscribed: z.boolean(),
})

export type AdminNewsletterBulkSubscription = z.infer<typeof AdminNewsletterBulkSubscriptionSchema>
