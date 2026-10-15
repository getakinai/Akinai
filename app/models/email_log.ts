import { DateTime } from 'luxon'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import Order from '#models/order'

export const EMAIL_LOG_STATUSES = ['queued', 'sent', 'failed'] as const

export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number]

const jsonArray = {
  prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
}

/**
 * A copy of an outgoing email, written by the logging mail messenger
 * (`start/mail.ts`). Emails with one-time codes are stored without a body
 * (`redacted`).
 */
export default class EmailLog extends BaseAppModel {
  static auditable = false

  @column()
  declare type: string

  @column()
  declare subject: string

  @column()
  declare fromAddress: string | null

  @column(jsonArray)
  declare toAddresses: string[]

  @column(jsonArray)
  declare ccAddresses: string[] | null

  @column(jsonArray)
  declare bccAddresses: string[] | null

  @column()
  declare html: string | null

  @column()
  declare text: string | null

  @column()
  declare redacted: boolean

  @column()
  declare status: EmailLogStatus

  @column()
  declare error: string | null

  @column()
  declare providerMessageId: string | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column()
  declare orderId: string | null

  @column()
  declare customerId: string | null

  @column()
  declare resentFromId: string | null

  @column()
  declare resentByUserId: string | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>
}
