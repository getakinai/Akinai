import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { AnalyticsEventType } from '#constants/analytics'

/** A single storefront event inside an analytics session. */
export default class AnalyticsEvent extends BaseAppModel {
  static auditable = false

  @column()
  declare sessionId: string

  @column()
  declare type: AnalyticsEventType

  @column()
  declare path: string

  @column()
  declare productId: string | null

  @column.dateTime()
  declare occurredAt: DateTime
}
