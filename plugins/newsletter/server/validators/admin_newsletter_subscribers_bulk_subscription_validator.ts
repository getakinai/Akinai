import vine from '@vinejs/vine'
import { bulkIdsSchema } from '#validators/helpers/bulk_ids'

/**
 * Unsubscribe (`subscribed: false`) or resubscribe many newsletter
 * subscribers.
 */
export const adminNewsletterSubscribersBulkSubscriptionValidator = vine.create({
  ids: bulkIdsSchema(),
  subscribed: vine.boolean({ strict: true }),
})
