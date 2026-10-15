import type Collection from '#models/collection'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class StorefrontCollectionOptionTransformer extends BaseTransformer<Collection> {
  toObject() {
    return this.pick(this.resource, ['id', 'title', 'status'])
  }
}
