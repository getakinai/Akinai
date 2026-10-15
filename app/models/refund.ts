import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Order from '#models/order'
import RefundLineItem from '#models/refund_line_item'
import User from '#models/user'

export const REFUND_METHODS = ['stripe', 'manual'] as const

export type RefundMethod = (typeof REFUND_METHODS)[number]

export const REFUND_STATUSES = ['pending', 'succeeded', 'failed'] as const

export type RefundStatus = (typeof REFUND_STATUSES)[number]

/**
 * Money given back on an order. Stripe refunds start `pending` until Stripe
 * confirms them; manual (bank transfer) refunds are recorded as `succeeded`
 * once staff send the money themselves.
 */
export default class Refund extends BaseAppModel {
  static auditable = false

  @column()
  declare orderId: string

  @column()
  declare returnId: string | null

  @column({ consume: (value) => Number(value) })
  declare amount: number

  @column({ consume: (value) => Number(value) })
  declare shippingAmount: number

  @column()
  declare method: RefundMethod

  @column()
  declare status: RefundStatus

  @column()
  declare providerRefundId: string | null

  @column()
  declare note: string | null

  @column()
  declare failureReason: string | null

  @column()
  declare createdByUserId: string | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => RefundLineItem)
  declare lines: HasMany<typeof RefundLineItem>
}
