import { BaseTransformer } from '@adonisjs/core/transformers'
import type { CustomerLocationOptions } from '#services/customer_service'

/**
 * Countries a customer can pick (from active markets) with each country's
 * timezones, and every timezone for a country outside that list.
 */
export default class CustomerLocationOptionsTransformer extends BaseTransformer<CustomerLocationOptions> {
  toObject() {
    return {
      countries: this.resource.countries.map(({ code, name, timezones }) => ({
        code,
        name,
        timezones,
      })),
      timezones: this.resource.timezones,
    }
  }
}
