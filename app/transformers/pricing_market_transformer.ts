import type Market from '#models/market'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * A market staff enter prices for (variants, shipping rates). The primary
 * market holds the base prices; the others have their own.
 */
export default class PricingMarketTransformer extends BaseTransformer<Market> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'currencyCode', 'isPrimary'])
  }
}
