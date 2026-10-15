import type ProductType from '#models/product_type'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `productsCount` reads the `products_count` extra loaded by
 * ProductTypeRepository (0 for a type that was just created).
 */
export default class ProductTypeTransformer extends BaseTransformer<ProductType> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'isActive', 'createdAt', 'updatedAt']),
      productsCount: Number(this.resource.$extras.products_count ?? 0),
    }
  }
}
