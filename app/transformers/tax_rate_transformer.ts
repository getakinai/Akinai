import type TaxRate from '#models/tax_rate'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TaxRateTransformer extends BaseTransformer<TaxRate> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'countryCode',
      'regionCode',
      'rate',
      'appliesToShipping',
      'isActive',
      'createdAt',
      'updatedAt',
    ])
  }
}
