import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { CustomerSegmentFilters } from '#constants/customer_marketing'

/**
 * A named set of customer list filters staff can reapply, such as
 * "Subscribed, 3+ orders".
 */
export default class CustomerSegment extends BaseAppModel {
  @column()
  declare name: string

  @column({ prepare: (value: CustomerSegmentFilters) => JSON.stringify(value) })
  declare filters: CustomerSegmentFilters
}
