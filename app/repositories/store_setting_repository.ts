import type { DateTime } from 'luxon'
import StoreSetting from '#models/store_setting'
import type {
  BusinessType,
  CurrencyDisplay,
  DateFormat,
  UnitSystem,
  WeightUnit,
} from '#constants/store_settings'

export type StoreBusinessData = {
  businessCountryCode: string
  businessType: BusinessType
  legalName: string | null
  ownerFirstName: string
  ownerLastName: string
  ownerDateOfBirth: DateTime
  ownerEmail: string
  ownerPhoneCountryCode: string
  ownerPhone: string
  ownerAddressLine1: string
  ownerSuburb: string | null
  ownerCity: string
  ownerRegion: string | null
  ownerPostalCode: string
}

export type StoreContactData = {
  storeName: string
  contactEmail: string
  phoneCountryCode: string | null
  phone: string | null
}

export type StoreAddressData = {
  storeAddressLine1: string
  storeSuburb: string | null
  storeCity: string
  storeRegion: string | null
  storePostalCode: string
  storeCountryCode: string
}

export type StoreDefaultsData = {
  operatingCountryCode?: string | null
  currencyCode: string
  currencyDisplay: CurrencyDisplay
  locale: string
  dateFormat: DateFormat
  timezone: string
  unitSystem: UnitSystem
  weightUnit: WeightUnit
  returnWindowDays: number
}

export type StoreNotificationsData = {
  orderNotificationEmails: string[]
}

export type StoreCheckoutData = {
  checkoutDeliveryHeading: string | null
  checkoutDeliveryNote: string | null
}

export type StoreOperatingCountryData = {
  operatingCountryCode: string
}

export type StoreSettingDefaults = Omit<
  StoreDefaultsData,
  'returnWindowDays' | 'operatingCountryCode'
> & {
  storeName: string
}

export type StoreSettingChanges =
  | StoreBusinessData
  | StoreContactData
  | StoreAddressData
  | StoreDefaultsData
  | StoreNotificationsData
  | StoreCheckoutData
  | StoreOperatingCountryData

export default class StoreSettingRepository {
  /**
   * Returns the single settings row, creating it from `defaults` when the
   * table is empty.
   */
  async firstOrCreate(defaults: StoreSettingDefaults): Promise<StoreSetting> {
    const existing = await StoreSetting.query().orderBy('created_at', 'asc').first()
    if (existing) return existing
    // Reload so columns the defaults don't set come back as null, not undefined.
    const created = await StoreSetting.create(defaults)
    return created.refresh()
  }

  async update(settings: StoreSetting, changes: StoreSettingChanges): Promise<StoreSetting> {
    settings.merge(changes)
    await settings.save()
    return settings
  }
}
