import type Location from '#models/location'
import type ProductVariant from '#models/product_variant'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `optionValues` needs `optionValues.option` preloaded, `inventory` needs
 * `inventoryLevels` and `marketPrices` needs `marketPrices` (prices in
 * non-primary markets); all are empty otherwise. `inventory` has one
 * row per given location, zero-filled where no level exists yet.
 */
export default class ProductVariantTransformer extends BaseTransformer<ProductVariant> {
  protected locations: Location[]

  constructor(resource: ProductVariant, locations: Location[] = []) {
    super(resource)
    this.locations = locations
  }

  toObject() {
    const variant = this.resource
    const sortedValues =
      'optionValues' in variant.$preloaded
        ? [...variant.optionValues].sort((a, b) => a.option.position - b.option.position)
        : []
    const levels = 'inventoryLevels' in variant.$preloaded ? variant.inventoryLevels : []
    const levelsByLocation = new Map(levels.map((level) => [level.locationId, level]))

    return {
      ...this.pick(variant, [
        'id',
        'productId',
        'title',
        'sku',
        'barcode',
        'price',
        'compareAtPrice',
        'weight',
        'trackInventory',
        'position',
        'createdAt',
        'updatedAt',
      ]),
      optionValues: sortedValues.map(({ option, value }) => ({ optionName: option.name, value })),
      optionValueIds: sortedValues.map(({ id }) => id),
      inventory: this.locations.map((location) => {
        const level = levelsByLocation.get(location.id)
        return {
          locationId: location.id,
          locationName: location.name,
          available: level?.available ?? 0,
          committed: level?.committed ?? 0,
          incoming: level?.incoming ?? 0,
        }
      }),
      availableTotal: levels.reduce((total, level) => total + level.available, 0),
      marketPrices: ('marketPrices' in variant.$preloaded ? variant.marketPrices : []).map(
        ({ marketId, price, compareAtPrice }) => ({ marketId, price, compareAtPrice })
      ),
    }
  }
}
