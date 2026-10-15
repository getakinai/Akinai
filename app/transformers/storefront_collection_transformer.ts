import type Collection from '#models/collection'
import { sanitizeRichText } from '#utils/sanitize_rich_text'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class StorefrontCollectionTransformer extends BaseTransformer<Collection> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'slug']),
      description: sanitizeRichText(this.resource.description),
    }
  }
}
