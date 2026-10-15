import type Market from '#models/market'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * An active market payment methods can be offered in.
 */
export default class PaymentMarketTransformer extends BaseTransformer<Market> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'currencyCode', 'isPrimary']),
      countryCodes: this.resource.countries.map((country) => country.countryCode),
    }
  }
}
