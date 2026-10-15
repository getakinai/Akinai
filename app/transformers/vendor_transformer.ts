import type Vendor from '#models/vendor'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { imageUrl } from '#utils/image_url'

/**
 * `productsCount` reads the `products_count` extra loaded by
 * VendorRepository (0 for a vendor that was just created).
 */
export default class VendorTransformer extends BaseTransformer<Vendor> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'isActive', 'createdAt', 'updatedAt']),
      imageUrl: this.resource.image ? imageUrl(this.resource.image) : null,
      productsCount: Number(this.resource.$extras.products_count ?? 0),
    }
  }
}
