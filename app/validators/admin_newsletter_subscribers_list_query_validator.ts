import vine from '@vinejs/vine'
import { NEWSLETTER_SOURCES } from '#constants/newsletter'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_NEWSLETTER_SUBSCRIBERS_SORT_KEYS = ['email', 'subscribedAt'] as const

export const adminNewsletterSubscribersListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_NEWSLETTER_SUBSCRIBERS_SORT_KEYS),
  status: vine.enum(['subscribed', 'unsubscribed'] as const).optional(),
  source: vine.enum(NEWSLETTER_SOURCES).optional(),
})
