import type StoreSetting from '#models/store_setting'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the full back-office shape. `toPublic` is the storefront
 * shape: it may show the legal business name, but must never include the
 * other legal entity or owner fields.
 */
export default class StoreSettingTransformer extends BaseTransformer<StoreSetting> {
  protected storefront() {
    return this.pick(this.resource, [
      'storeName',
      'legalName',
      'contactEmail',
      'phone',
      'storeAddressLine1',
      'storeSuburb',
      'storeCity',
      'storeRegion',
      'storePostalCode',
      'storeCountryCode',
      'operatingCountryCode',
      'currencyCode',
      'currencyDisplay',
      'locale',
      'dateFormat',
      'timezone',
      'unitSystem',
      'weightUnit',
      'checkoutDeliveryHeading',
      'checkoutDeliveryNote',
    ])
  }

  toObject() {
    return {
      id: this.resource.id,
      ...this.storefront(),
      ...this.pick(this.resource, [
        'businessCountryCode',
        'businessType',
        'ownerFirstName',
        'ownerLastName',
        'ownerEmail',
        'ownerPhoneCountryCode',
        'ownerPhone',
        'ownerAddressLine1',
        'ownerSuburb',
        'ownerCity',
        'ownerRegion',
        'ownerPostalCode',
        'phoneCountryCode',
        'returnWindowDays',
        'createdAt',
        'updatedAt',
      ]),
      ownerDateOfBirth: this.resource.ownerDateOfBirth?.toISODate() ?? null,
      orderNotificationEmails: this.resource.orderNotificationEmails ?? [],
    }
  }

  toPublic() {
    return this.storefront()
  }
}
