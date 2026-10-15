import type { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { NewsletterSource } from '../constants.js'

/**
 * Email signed up through a storefront newsletter form. Kept apart from
 * customers: subscribing never creates a customer profile.
 */
export default class NewsletterSubscriber extends BaseAppModel {
  @column()
  declare email: string

  @column()
  declare source: NewsletterSource

  @column()
  declare isSubscribed: boolean

  /** When the email last signed up. */
  @column.dateTime()
  declare subscribedAt: DateTime

  @column.dateTime()
  declare unsubscribedAt: DateTime | null
}
