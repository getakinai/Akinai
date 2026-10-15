import { DateTime } from 'luxon'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import Order from '#models/order'
import Refund from '#models/refund'
import ReturnLineItem from '#models/return_line_item'

export const RETURN_STATUSES = [
  'requested',
  'approved',
  'declined',
  'received',
  'closed',
  'cancelled',
] as const

export type ReturnStatus = (typeof RETURN_STATUSES)[number]

/** Returns whose items still count against the returnable quantity. */
export const ACTIVE_RETURN_STATUSES: readonly ReturnStatus[] = [
  'requested',
  'approved',
  'received',
  'closed',
]

export const RETURN_REASONS = [
  'size_too_small',
  'size_too_large',
  'not_as_described',
  'defective',
  'wrong_item',
  'changed_mind',
  'other',
] as const

export type ReturnReason = (typeof RETURN_REASONS)[number]

/**
 * Items a customer sends back. Requested by the customer (or created by
 * staff), then approved or declined, received, and closed by a refund.
 */
export default class OrderReturn extends BaseAppModel {
  static table = 'returns'

  static auditable = false

  @column()
  declare orderId: string

  @column()
  declare customerId: string | null

  /** 1, 2, 3… within the order. */
  @column()
  declare number: number

  @column()
  declare status: ReturnStatus

  @column()
  declare customerNote: string | null

  @column()
  declare declineReason: string | null

  @column()
  declare staffNote: string | null

  @column()
  declare refundId: string | null

  @column.dateTime()
  declare requestedAt: DateTime

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime()
  declare receivedAt: DateTime | null

  @column.dateTime()
  declare closedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Refund)
  declare refund: BelongsTo<typeof Refund>

  @hasMany(() => ReturnLineItem, { foreignKey: 'returnId' })
  declare lines: HasMany<typeof ReturnLineItem>
}
