import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NewsletterSubscriberService from '#services/newsletter_subscriber_service'
import BulkResultTransformer from '#transformers/bulk_result_transformer'
import { adminNewsletterSubscribersBulkSubscriptionValidator } from '#validators/admin_newsletter_subscribers_bulk_subscription_validator'

@inject()
export default class AdminNewsletterSubscribersBulkSubscriptionController {
  constructor(protected newsletterSubscriberService: NewsletterSubscriberService) {}

  async handle(ctx: HttpContext) {
    const { ids, subscribed } = await ctx.request.validateUsing(
      adminNewsletterSubscribersBulkSubscriptionValidator
    )
    const result = await this.newsletterSubscriberService.bulkSetSubscribed(ids, subscribed)
    return ctx.serialize(BulkResultTransformer.transform(result))
  }
}
