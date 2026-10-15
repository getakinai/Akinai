import { DateTime } from 'luxon'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { Permission } from '#abilities/permissions'
import type {
  AdminEventActorType,
  AdminEventChannel,
  AdminEventStatus,
  AdminEventType,
} from '#constants/admin_events'
import BaseAppModel from '#models/base/base_app_model'
import type { AuditValue } from '#models/audit_log'
import Customer from '#models/customer'
import Order from '#models/order'
import User from '#models/user'

export type AdminEventDetails = Record<string, AuditValue>

/**
 * Something staff are notified about live (e.g. an order was paid), with
 * who did it. Pushed to browsers over Redis + SSE; `status` records whether
 * the push went out so failed ones can be retried from /admin/events.
 */
export default class AdminEvent extends BaseAppModel {
  static auditable = false

  @column()
  declare type: AdminEventType

  @column()
  declare channel: AdminEventChannel

  /** Staff need this permission to see the event. */
  @column()
  declare permission: Permission

  @column()
  declare title: string

  @column({ prepare: (value: AdminEventDetails) => JSON.stringify(value) })
  declare details: AdminEventDetails

  @column()
  declare subjectType: string

  @column()
  declare subjectId: string

  @column()
  declare subjectLabel: string | null

  @column()
  declare orderId: string | null

  @column()
  declare actorType: AdminEventActorType

  @column()
  declare actorUserId: string | null

  @column()
  declare actorCustomerId: string | null

  /** Actor name when the event happened. */
  @column()
  declare actorLabel: string | null

  @column()
  declare status: AdminEventStatus

  @column()
  declare attempts: number

  @column()
  declare lastError: string | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'actorUserId' })
  declare actorUser: BelongsTo<typeof User>

  @belongsTo(() => Customer, { foreignKey: 'actorCustomerId' })
  declare actorCustomer: BelongsTo<typeof Customer>
}
