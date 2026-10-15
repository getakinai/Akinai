import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsTrackingService from '#services/analytics_tracking_service'
import { storefrontAnalyticsEventStoreValidator } from '#validators/storefront_analytics_event_store_validator'

@inject()
export default class StorefrontAnalyticsEventsStoreController {
  constructor(protected analyticsTrackingService: AnalyticsTrackingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(storefrontAnalyticsEventStoreValidator)
    const recorded = await this.analyticsTrackingService.track(ctx, payload)

    return { data: { recorded } }
  }
}
