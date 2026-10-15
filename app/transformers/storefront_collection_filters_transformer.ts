import { BaseTransformer } from '@adonisjs/core/transformers'
import type { CollectionFacets } from '#repositories/storefront_catalog_repository'

/** The filters a collection page offers, priced in the shopper's market. */
export default class StorefrontCollectionFiltersTransformer extends BaseTransformer<CollectionFacets> {
  toObject() {
    const { price, vendors, productTypes, options } = this.resource
    return {
      price: { min: price.min, max: price.max },
      vendors: vendors.map(({ id, name, count }) => ({ id, name, count })),
      productTypes: productTypes.map(({ id, name, count }) => ({ id, name, count })),
      options: options.map(({ name, values }) => ({ name, values: [...values] })),
    }
  }
}
