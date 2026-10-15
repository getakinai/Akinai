import type { StorefrontHomeRail } from '#services/storefront_home_service'
import StorefrontProductCardTransformer from '#transformers/storefront_product_card_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class StorefrontHomeCollectionTransformer extends BaseTransformer<StorefrontHomeRail> {
  toObject() {
    const { collection, products } = this.resource

    return {
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      products: StorefrontProductCardTransformer.transform(products),
    }
  }
}
