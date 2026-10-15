import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type {
  BusinessType,
  CurrencyDisplay,
  DateFormat,
  UnitSystem,
  WeightUnit,
} from '#constants/store_settings'

/**
 * Store-wide details and defaults. The table holds a single row.
 */
export default class StoreSetting extends BaseAppModel {
  static auditHidden = [
    'ownerDateOfBirth',
    'ownerPhone',
    'ownerAddressLine1',
    'ownerSuburb',
    'ownerCity',
    'ownerRegion',
    'ownerPostalCode',
  ] as const

  static auditLabelFor() {
    return 'Store details'
  }

  @column()
  declare businessCountryCode: string | null

  @column()
  declare businessType: BusinessType | null

  @column()
  declare legalName: string | null

  @column()
  declare ownerFirstName: string | null

  @column()
  declare ownerLastName: string | null

  @column.date()
  declare ownerDateOfBirth: DateTime | null

  @column()
  declare ownerEmail: string | null

  @column()
  declare ownerPhoneCountryCode: string | null

  @column()
  declare ownerPhone: string | null

  @column({ columnName: 'owner_address_line1' })
  declare ownerAddressLine1: string | null

  @column()
  declare ownerSuburb: string | null

  @column()
  declare ownerCity: string | null

  @column()
  declare ownerRegion: string | null

  @column()
  declare ownerPostalCode: string | null

  @column()
  declare storeName: string

  @column()
  declare contactEmail: string | null

  @column()
  declare phoneCountryCode: string | null

  @column()
  declare phone: string | null

  @column({ columnName: 'store_address_line1' })
  declare storeAddressLine1: string | null

  @column()
  declare storeSuburb: string | null

  @column()
  declare storeCity: string | null

  @column()
  declare storeRegion: string | null

  @column()
  declare storePostalCode: string | null

  @column()
  declare storeCountryCode: string | null

  /** The country the store delivers to; picks the setup defaults (markets, zones). */
  @column()
  declare operatingCountryCode: string | null

  @column()
  declare currencyCode: string

  @column()
  declare currencyDisplay: CurrencyDisplay

  @column()
  declare locale: string

  @column()
  declare dateFormat: DateFormat

  @column()
  declare timezone: string

  @column()
  declare unitSystem: UnitSystem

  @column()
  declare weightUnit: WeightUnit

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
  })
  declare orderNotificationEmails: string[] | null

  @column()
  declare returnWindowDays: number

  @column()
  declare checkoutDeliveryHeading: string | null

  @column()
  declare checkoutDeliveryNote: string | null
}
