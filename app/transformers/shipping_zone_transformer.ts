import type ShippingZone from '#models/shipping_zone'
import ShippingRateTransformer from '#transformers/shipping_rate_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

const count = (value: unknown) => (value !== undefined ? Number(value) : null)

/**
 * List rows read the `countries_count` / `regions_count` / `rates_count`
 * extras from `withCount`; the detail variant needs the `countries`,
 * `regions` and `rates` preloads.
 */
export default class ShippingZoneTransformer extends BaseTransformer<ShippingZone> {
  toObject() {
    const { $extras } = this.resource
    return {
      ...this.pick(this.resource, ['id', 'name', 'isActive', 'createdAt', 'updatedAt']),
      countriesCount: count($extras.countries_count),
      regionsCount: count($extras.regions_count),
      ratesCount: count($extras.rates_count),
    }
  }

  toDetail() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'isActive', 'createdAt', 'updatedAt']),
      countryCodes: this.resource.countries.map(({ countryCode }) => countryCode),
      regionCodes: this.resource.regions.map(({ regionCode }) => regionCode),
      rates: ShippingRateTransformer.transform(this.resource.rates),
    }
  }
}
