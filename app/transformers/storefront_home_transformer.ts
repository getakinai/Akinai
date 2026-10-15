import type { StorefrontHome } from '#services/storefront_home_service'
import StorefrontHomeCollectionTransformer from '#transformers/storefront_home_collection_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { imageUrl } from '#utils/image_url'

export default class StorefrontHomeTransformer extends BaseTransformer<StorefrontHome> {
  toObject() {
    const { collections, vendors } = this.resource

    return {
      collections: StorefrontHomeCollectionTransformer.transform(collections).depth(2),
      vendors: vendors.map(({ id, name, image }) => ({
        id,
        name,
        imageUrl: image ? imageUrl(image) : null,
      })),
    }
  }
}
