import type ShippingRate from '#models/shipping_rate'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `marketPrices` (prices in non-primary markets) needs `marketPrices`
 * preloaded; it is empty otherwise.
 */
export default class ShippingRateTransformer extends BaseTransformer<ShippingRate> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'shippingZoneId',
        'name',
        'description',
        'price',
        'minSubtotal',
        'maxSubtotal',
        'minWeight',
        'maxWeight',
        'minItems',
        'maxItems',
        'isActive',
        'createdAt',
        'updatedAt',
      ]),
      marketPrices: ('marketPrices' in this.resource.$preloaded
        ? this.resource.marketPrices
        : []
      ).map(({ marketId, price, minSubtotal, maxSubtotal }) => ({
        marketId,
        price,
        minSubtotal,
        maxSubtotal,
      })),
    }
  }
}
