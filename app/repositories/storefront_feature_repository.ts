import db from '@adonisjs/lucid/services/db'
import StorefrontFeature from '#models/storefront_feature'
import type { FeatureIcon } from '#constants/storefront'

export type StorefrontFeatureData = { icon: FeatureIcon; title: string; text: string }

export default class StorefrontFeatureRepository {
  async list(): Promise<StorefrontFeature[]> {
    return StorefrontFeature.query().orderBy('position', 'asc').orderBy('created_at', 'asc')
  }

  /**
   * Replaces every feature with `items`, in order, in one transaction.
   */
  async replace(items: StorefrontFeatureData[]): Promise<StorefrontFeature[]> {
    return db.transaction(async (trx) => {
      await StorefrontFeature.query({ client: trx }).delete()
      if (items.length === 0) return []
      return StorefrontFeature.createMany(
        items.map((item, position) => ({ ...item, position })),
        { client: trx }
      )
    })
  }
}
