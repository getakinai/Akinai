import type CustomerAddress from '#models/customer_address'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CustomerAddressTransformer extends BaseTransformer<CustomerAddress> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'customerId',
      'fullName',
      'company',
      'address1',
      'address2',
      'city',
      'province',
      'regionCode',
      'postalCode',
      'countryCode',
      'phone',
      'isDefault',
      'createdAt',
      'updatedAt',
    ])
  }
}
