import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { SupportMessageAuthorType } from '#constants/support'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import SupportTicket from '#models/support_ticket'
import User from '#models/user'

/**
 * One message in a support ticket thread. Staff messages with `isInternal`
 * are notes for the team and are never shown to the customer.
 */
export default class SupportTicketMessage extends BaseAppModel {
  static auditable = false

  @column()
  declare supportTicketId: string

  @column()
  declare userId: string | null

  @column()
  declare customerId: string | null

  @column()
  declare authorType: SupportMessageAuthorType

  @column()
  declare isInternal: boolean

  @column()
  declare body: string

  @belongsTo(() => SupportTicket)
  declare supportTicket: BelongsTo<typeof SupportTicket>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>
}
