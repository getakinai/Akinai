import type { DateTime } from 'luxon'
import { column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import CustomerAccount from '#models/customer_account'
import CustomerAddress from '#models/customer_address'
import CustomerTag from '#models/customer_tag'
import type { MarketingConsentSource } from '#constants/customer_marketing'

/**
 * Canonical record of a person's relationship with the store. A profile can
 * exist without a storefront login; the login lives on `CustomerAccount`.
 */
export default class Customer extends BaseAppModel {
  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare isActive: boolean

  @column()
  declare marketId: string | null

  @column()
  declare countryCode: string | null

  @column()
  declare timezone: string | null

  /** Agreed to receive news, promotions and discounts by email. */
  @column()
  declare acceptsMarketing: boolean

  /** When `acceptsMarketing` last changed. */
  @column.dateTime()
  declare marketingConsentAt: DateTime | null

  @column()
  declare marketingConsentSource: MarketingConsentSource | null

  /** Staff-only note; never shown to the customer. */
  @column()
  declare note: string | null

  @hasOne(() => CustomerAccount)
  declare account: HasOne<typeof CustomerAccount>

  @hasMany(() => CustomerAddress)
  declare addresses: HasMany<typeof CustomerAddress>

  @hasMany(() => CustomerTag)
  declare tags: HasMany<typeof CustomerTag>
}
