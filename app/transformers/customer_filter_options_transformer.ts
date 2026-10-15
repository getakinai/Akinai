import { BaseTransformer } from '@adonisjs/core/transformers'
import { countryName } from '#constants/countries'
import type { CustomerFilterOptions } from '#repositories/customer_repository'

/** Values the admin customer list filters can pick from. */
export default class CustomerFilterOptionsTransformer extends BaseTransformer<CustomerFilterOptions> {
  toObject() {
    return {
      tags: this.resource.tags,
      countries: this.resource.countryCodes.map((code) => ({ code, name: countryName(code) })),
      currencyCodes: this.resource.currencyCodes,
    }
  }
}
