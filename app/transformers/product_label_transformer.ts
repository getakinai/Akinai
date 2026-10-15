import type ProductLabel from '#models/product_label'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `productsCount` reads the `products_count` extra loaded by
 * ProductLabelRepository (0 for a label that was just created).
 */
export default class ProductLabelTransformer extends BaseTransformer<ProductLabel> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'color', 'isActive', 'createdAt', 'updatedAt']),
      productsCount: Number(this.resource.$extras.products_count ?? 0),
    }
  }
}
