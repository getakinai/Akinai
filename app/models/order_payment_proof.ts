import { DateTime } from 'luxon'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Order from '#models/order'

/**
 * What a customer sent to show they paid a bank transfer order: a
 * screenshot, payment details, or both. One per order; resubmitting
 * replaces it and clears the previous review.
 */
export default class OrderPaymentProof extends BaseAppModel {
  static auditable = false

  @column()
  declare orderId: string

  /** Key on the private drive disk; never sent to the browser. */
  @column({ serializeAs: null })
  declare imageKey: string | null

  @column()
  declare details: string | null

  @column.dateTime()
  declare submittedAt: DateTime

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @column()
  declare reviewedByUserId: string | null

  @column()
  declare rejectionReason: string | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  get isRejected() {
    return this.rejectionReason !== null
  }
}
