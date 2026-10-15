import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NewsletterSubscriberService from '../services/newsletter_subscriber_service.js'
import { storefrontNewsletterStoreValidator } from '../validators/storefront_newsletter_store_validator.js'

@inject()
export default class StorefrontNewsletterStoreController {
  constructor(protected newsletterSubscriberService: NewsletterSubscriberService) {}

  /**
   * Same response for every valid email, known or not, subscribed or not.
   */
  async handle(ctx: HttpContext) {
    const { email } = await ctx.request.validateUsing(storefrontNewsletterStoreValidator)
    await this.newsletterSubscriberService.subscribe(email, 'footer')
    return ctx.response.accepted({ data: { subscribed: true } })
  }
}
