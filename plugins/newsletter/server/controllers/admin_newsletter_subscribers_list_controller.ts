import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NewsletterSubscriberService from '../services/newsletter_subscriber_service.js'
import NewsletterSubscriberTransformer from '../transformers/newsletter_subscriber_transformer.js'
import { adminNewsletterSubscribersListQueryValidator } from '../validators/admin_newsletter_subscribers_list_query_validator.js'

@inject()
export default class AdminNewsletterSubscribersListController {
  constructor(protected newsletterSubscriberService: NewsletterSubscriberService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminNewsletterSubscribersListQueryValidator, {
      data: ctx.request.qs(),
    })
    const subscribers = await this.newsletterSubscriberService.paginate(filters)

    return ctx.serialize(
      NewsletterSubscriberTransformer.paginate(subscribers.all(), subscribers.getMeta())
    )
  }
}
