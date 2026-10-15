import type Market from '#models/market'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `countriesCount` reads the `countries_count` extra from
 * `withCount('countries')`; `countryCodes` needs the `countries` preload.
 * Both fall back to null when not loaded.
 */
export default class MarketTransformer extends BaseTransformer<Market> {
  toObject() {
    const { $extras, $preloaded } = this.resource
    const countries = $preloaded.countries as Market['countries'] | undefined

    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'handle',
        'currencyCode',
        'pricesIncludeTax',
        'isPrimary',
        'isActive',
        'createdAt',
        'updatedAt',
      ]),
      countriesCount:
        $extras.countries_count !== undefined
          ? Number($extras.countries_count)
          : (countries?.length ?? null),
      countryCodes: countries ? countries.map(({ countryCode }) => countryCode) : null,
    }
  }
}
