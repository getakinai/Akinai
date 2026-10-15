import db from '@adonisjs/lucid/services/db'
import InventoryLevel from '#models/inventory_level'
import type ProductVariant from '#models/product_variant'

export type InventoryLevelData = {
  locationId: string
  available: number
}

export default class InventoryLevelRepository {
  /**
   * Sets `available` per location, creating missing levels, in one
   * transaction. Locations not listed are left untouched.
   */
  async setAvailable(variant: ProductVariant, levels: InventoryLevelData[]): Promise<void> {
    if (levels.length === 0) return

    await db.transaction(async (trx) => {
      await InventoryLevel.updateOrCreateMany(
        ['productVariantId', 'locationId'],
        levels.map(({ locationId, available }) => ({
          productVariantId: variant.id,
          locationId,
          available,
        })),
        { client: trx }
      )
    })
  }
}
