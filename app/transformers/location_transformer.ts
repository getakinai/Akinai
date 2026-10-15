import type Location from '#models/location'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `availableTotal` reads the `available_total` extra from
 * `withAggregate('inventoryLevels')` (null from SUM over no rows becomes 0)
 * and falls back to null when the aggregate was not loaded.
 */
export default class LocationTransformer extends BaseTransformer<Location> {
  toObject() {
    const availableTotal = this.resource.$extras.available_total

    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'addressLine',
        'city',
        'country',
        'isActive',
        'isDefault',
        'createdAt',
        'updatedAt',
      ]),
      availableTotal: availableTotal === undefined ? null : Number(availableTotal ?? 0),
    }
  }
}
