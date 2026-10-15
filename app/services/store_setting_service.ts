import { inject } from '@adonisjs/core'
import type StoreSetting from '#models/store_setting'
import { SOLE_TRADER, STORE_SETTING_DEFAULTS } from '#constants/store_settings'
import StoreSettingRepository, {
  type StoreAddressData,
  type StoreBusinessData,
  type StoreCheckoutData,
  type StoreContactData,
  type StoreDefaultsData,
  type StoreNotificationsData,
} from '#repositories/store_setting_repository'

@inject()
export default class StoreSettingService {
  constructor(protected storeSettingRepository: StoreSettingRepository) {}

  async get(): Promise<StoreSetting> {
    return this.storeSettingRepository.firstOrCreate({ ...STORE_SETTING_DEFAULTS })
  }

  async updateBusiness(data: StoreBusinessData): Promise<StoreSetting> {
    const settings = await this.get()
    return this.storeSettingRepository.update(settings, {
      ...data,
      legalName: data.businessType === SOLE_TRADER ? null : data.legalName,
    })
  }

  async updateContact(data: StoreContactData): Promise<StoreSetting> {
    const settings = await this.get()
    return this.storeSettingRepository.update(settings, {
      ...data,
      phoneCountryCode: data.phone ? data.phoneCountryCode : null,
    })
  }

  async updateAddress(data: StoreAddressData): Promise<StoreSetting> {
    return this.storeSettingRepository.update(await this.get(), data)
  }

  async updateDefaults({
    operatingCountryCode,
    ...data
  }: StoreDefaultsData): Promise<StoreSetting> {
    return this.storeSettingRepository.update(
      await this.get(),
      operatingCountryCode === undefined ? data : { ...data, operatingCountryCode }
    )
  }

  async setOperatingCountry(countryCode: string): Promise<StoreSetting> {
    return this.storeSettingRepository.update(await this.get(), {
      operatingCountryCode: countryCode.toUpperCase(),
    })
  }

  async updateNotifications(data: StoreNotificationsData): Promise<StoreSetting> {
    return this.storeSettingRepository.update(await this.get(), data)
  }

  async updateCheckout(data: StoreCheckoutData): Promise<StoreSetting> {
    return this.storeSettingRepository.update(await this.get(), data)
  }

  /**
   * Staff addresses for order alerts: the notification list, or the owner
   * email when the list is empty.
   */
  async staffRecipients(): Promise<string[]> {
    const settings = await this.get()
    const list = settings.orderNotificationEmails ?? []
    if (list.length > 0) return list
    return settings.ownerEmail ? [settings.ownerEmail] : []
  }
}
