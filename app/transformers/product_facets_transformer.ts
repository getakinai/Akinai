import type { ProductFacets } from '#services/product_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Choices for the product form's organization fields.
 */
export default class ProductFacetsTransformer extends BaseTransformer<ProductFacets> {
  toObject() {
    const { productTypes, vendors, productLabels, tags } = this.resource
    return {
      productTypes: productTypes.map(({ id, name }) => ({ id, name })),
      vendors: vendors.map(({ id, name }) => ({ id, name })),
      productLabels: productLabels.map(({ id, name, color }) => ({ id, name, color })),
      tags,
    }
  }
}
