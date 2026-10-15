import { DateTime } from 'luxon'
import NewsletterSubscriber from '#models/newsletter_subscriber'
import type { NewsletterSource } from '#constants/newsletter'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type NewsletterSubscriberSortKey = 'email' | 'subscribedAt'

export type NewsletterSubscriberStatusFilter = 'subscribed' | 'unsubscribed'

export type PaginateNewsletterSubscribersData = {
  q?: string
  status?: NewsletterSubscriberStatusFilter
  source?: NewsletterSource
  sort: NewsletterSubscriberSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<NewsletterSubscriberSortKey, string> = {
  email: 'email',
  subscribedAt: 'subscribed_at',
}

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'

export default class NewsletterSubscriberRepository {
  async paginate({
    q,
    status,
    source,
    sort,
    direction,
    page,
    perPage,
  }: PaginateNewsletterSubscribersData) {
    return NewsletterSubscriber.query()
      .if(q, (query) => query.whereILike('email', containsPattern(q)))
      .if(status, (query) => query.where('is_subscribed', status === 'subscribed'))
      .if(source, (query) => query.where('source', source!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  /**
   * Signs `email` up: creates the subscriber, or resubscribes one that
   * unsubscribed. An email that is already subscribed is left alone.
   */
  async subscribe(email: string, source: NewsletterSource): Promise<void> {
    const existing = await NewsletterSubscriber.findBy('email', email)
    if (existing) return this.resubscribe(existing, source)

    try {
      await NewsletterSubscriber.create({
        email,
        source,
        isSubscribed: true,
        subscribedAt: DateTime.now(),
        unsubscribedAt: null,
      })
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      const created = await NewsletterSubscriber.findByOrFail('email', email)
      await this.resubscribe(created, source)
    }
  }

  private async resubscribe(subscriber: NewsletterSubscriber, source: NewsletterSource) {
    if (subscriber.isSubscribed) return
    await subscriber
      .merge({ source, isSubscribed: true, subscribedAt: DateTime.now(), unsubscribedAt: null })
      .save()
  }

  /**
   * Unsubscribes (`subscribed = false`) or resubscribes the subscribers in
   * `ids`, skipping ones already in that state. Returns the changed rows as
   * they were.
   */
  async setSubscribedMany(ids: string[], subscribed: boolean): Promise<NewsletterSubscriber[]> {
    return bulkUpdate(
      NewsletterSubscriber,
      ids,
      { isSubscribed: subscribed, unsubscribedAt: subscribed ? null : DateTime.now() },
      (query) => query.where('is_subscribed', !subscribed)
    )
  }
}
