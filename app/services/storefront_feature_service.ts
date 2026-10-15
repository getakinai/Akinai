import { inject } from '@adonisjs/core'
import type StorefrontFeature from '#models/storefront_feature'
import StorefrontFeatureRepository, {
  type StorefrontFeatureData,
} from '#repositories/storefront_feature_repository'

@inject()
export default class StorefrontFeatureService {
  constructor(protected storefrontFeatureRepository: StorefrontFeatureRepository) {}

  async list(): Promise<StorefrontFeature[]> {
    return this.storefrontFeatureRepository.list()
  }

  /** An empty list clears the features, so the storefront shows its defaults. */
  async replace(items: StorefrontFeatureData[]): Promise<StorefrontFeature[]> {
    return this.storefrontFeatureRepository.replace(
      items.map(({ icon, title, text }) => ({ icon, title, text }))
    )
  }
}
