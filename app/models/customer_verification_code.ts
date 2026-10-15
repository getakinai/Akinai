import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { VerificationPurpose } from '#constants/customer_verification'

/**
 * What a pending signup keeps until the email is confirmed. The password is
 * already hashed.
 */
export type SignupVerificationPayload = {
  fullName: string | null
  phone: string | null
  passwordHash: string
  /** Missing on rows saved before signup asked for marketing consent. */
  acceptsMarketing?: boolean
}

/**
 * A one-time code emailed to prove the customer owns an email address.
 * Only the HMAC of the code is stored.
 */
export default class CustomerVerificationCode extends BaseAppModel {
  static auditable = false

  @column()
  declare email: string

  @column()
  declare purpose: VerificationPurpose

  @column({ serializeAs: null })
  declare codeHash: string

  @column({
    serializeAs: null,
    prepare: (value: SignupVerificationPayload | null) => (value ? JSON.stringify(value) : null),
  })
  declare payload: SignupVerificationPayload | null

  @column()
  declare attempts: number

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare consumedAt: DateTime | null

  @column.dateTime()
  declare lastSentAt: DateTime
}
