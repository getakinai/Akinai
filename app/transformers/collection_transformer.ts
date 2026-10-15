import type Collection from '#models/collection'
import { imageUrl } from '#utils/image_url'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Expects `rules` to be preloaded and the `products_count` extra set by
 * CollectionService.
 */
export default class CollectionTransformer extends BaseTransformer<Collection> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'title',
        'slug',
        'description',
        'type',
        'match',
        'sortOrder',
        'seoTitle',
        'seoDescription',
        'status',
        'archivedAt',
        'createdAt',
        'updatedAt',
      ]),
      imageUrl: this.resource.image ? imageUrl(this.resource.image) : null,
      productsCount: Number(this.resource.$extras.products_count ?? 0),
      rules: this.resource.rules.map(({ id, field, operator, value, position }) => ({
        id,
        field,
        operator,
        value,
        position,
      })),
    }
  }
}
