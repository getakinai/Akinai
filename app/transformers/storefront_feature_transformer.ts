import type StorefrontFeature from '#models/storefront_feature'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class StorefrontFeatureTransformer extends BaseTransformer<StorefrontFeature> {
  toObject() {
    return this.pick(this.resource, ['id', 'icon', 'title', 'text', 'position'])
  }
}
