import type { DateTime } from 'luxon'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { SUPPORT_REFERENCE_PREFIX, type SupportTicketStatus } from '#constants/support'
import BaseAppModel from '#models/base/base_app_model'
import Customer from '#models/customer'
import SupportTicketMessage from '#models/support_ticket_message'
import User from '#models/user'

export function supportTicketReference(number: number) {
  return `${SUPPORT_REFERENCE_PREFIX}${number}`
}

/**
 * A question a customer or guest sent from the storefront help chat when
 * the help docs didn't answer it. Staff reply from the back office; the
 * customer reads and replies through an emailed link (`accessTokenHash`)
 * or, when signed in, from their account.
 */
export default class SupportTicket extends BaseAppModel {
  static auditHidden = ['accessTokenHash', 'accessTokenEncrypted', 'accessTokenExpiresAt']

  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    return typeof attributes.number === 'number' ? supportTicketReference(attributes.number) : null
  }

  @column()
  declare number: number

  @column()
  declare customerId: string | null

  @column()
  declare assignedUserId: string | null

  @column()
  declare fullName: string

  @column()
  declare email: string

  @column()
  declare mobile: string

  @column()
  declare status: SupportTicketStatus

  @column({ prepare: (value: string[]) => JSON.stringify(value) })
  declare chatTranscript: string[]

  /** HMAC of the thread link token, for lookups. */
  @column({ serializeAs: null })
  declare accessTokenHash: string

  /** The token itself, encrypted, so every email can carry the same link. */
  @column({ serializeAs: null })
  declare accessTokenEncrypted: string

  @column.dateTime({ serializeAs: null })
  declare accessTokenExpiresAt: DateTime

  @column.dateTime()
  declare lastMessageAt: DateTime

  @column.dateTime()
  declare closedAt: DateTime | null

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => User, { foreignKey: 'assignedUserId' })
  declare assignedUser: BelongsTo<typeof User>

  @hasMany(() => SupportTicketMessage)
  declare messages: HasMany<typeof SupportTicketMessage>

  get reference() {
    return supportTicketReference(this.number)
  }
}
