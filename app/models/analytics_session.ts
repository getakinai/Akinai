import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { AnalyticsDeviceType, AnalyticsSource } from '#constants/analytics'

/**
 * One storefront visit. It ends after 30 minutes without activity. Holds no
 * IP address or user agent, only the derived device type and traffic source.
 */
export default class AnalyticsSession extends BaseAppModel {
  static auditable = false

  @column()
  declare visitorId: string

  @column()
  declare customerId: string | null

  @column()
  declare marketId: string | null

  @column.dateTime()
  declare startedAt: DateTime

  @column.dateTime()
  declare lastSeenAt: DateTime

  @column()
  declare landingPath: string

  @column()
  declare referrerHost: string | null

  @column()
  declare source: AnalyticsSource

  @column()
  declare utmSource: string | null

  @column()
  declare utmMedium: string | null

  @column()
  declare utmCampaign: string | null

  @column()
  declare deviceType: AnalyticsDeviceType

  @column()
  declare pageViews: number

  @column()
  declare viewedProduct: boolean

  @column()
  declare addedToCart: boolean

  @column()
  declare reachedCheckout: boolean

  @column()
  declare convertedOrderId: string | null
}
