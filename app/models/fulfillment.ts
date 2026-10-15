import { DateTime } from 'luxon'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import FulfillmentLineItem from '#models/fulfillment_line_item'
import Location from '#models/location'
import Order from '#models/order'

export const FULFILLMENT_RECORD_STATUSES = ['success', 'cancelled'] as const

export type FulfillmentRecordStatus = (typeof FULFILLMENT_RECORD_STATUSES)[number]

/**
 * Items of an order shipped together from one location, with optional
 * carrier tracking. Cancelling returns its quantities to unfulfilled.
 */
export default class Fulfillment extends BaseAppModel {
  @column()
  declare orderId: string

  /** 1, 2, 3… within the order. */
  @column()
  declare number: number

  @column()
  declare status: FulfillmentRecordStatus

  @column()
  declare locationId: string | null

  @column()
  declare trackingCompany: string | null

  @column()
  declare trackingNumber: string | null

  @column()
  declare trackingUrl: string | null

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Location)
  declare location: BelongsTo<typeof Location>

  @hasMany(() => FulfillmentLineItem)
  declare lines: HasMany<typeof FulfillmentLineItem>

  get isCancelled() {
    return this.status === 'cancelled'
  }

  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    return typeof attributes.number === 'number' ? `Fulfillment #${attributes.number}` : null
  }
}
