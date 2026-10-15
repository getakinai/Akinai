import type NewsletterSubscriber from '../models/newsletter_subscriber.js'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class NewsletterSubscriberTransformer extends BaseTransformer<NewsletterSubscriber> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'email', 'source', 'isSubscribed']),
      subscribedAt: this.resource.subscribedAt.toISO(),
      unsubscribedAt: this.resource.unsubscribedAt?.toISO() ?? null,
    }
  }
}
