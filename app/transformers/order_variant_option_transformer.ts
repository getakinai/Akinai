import type ProductVariant from '#models/product_variant'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * A row in the draft order product picker. Needs the `product` preload;
 * `available` reads the `available_total` extra (null when not tracked).
 */
export default class OrderVariantOptionTransformer extends BaseTransformer<ProductVariant> {
  toObject() {
    const variant = this.resource
    return {
      ...this.pick(variant, ['id', 'productId', 'title', 'sku', 'price', 'trackInventory']),
      productTitle: variant.product.title,
      available: variant.trackInventory ? Number(variant.$extras.available_total ?? 0) : null,
    }
  }
}
