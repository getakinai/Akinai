import { inject } from '@adonisjs/core'
import type ProductVariant from '#models/product_variant'
import InventoryLevelRepository, {
  type InventoryLevelData,
} from '#repositories/inventory_level_repository'
import ProductVariantRepository from '#repositories/product_variant_repository'

@inject()
export default class InventoryService {
  constructor(
    protected inventoryLevelRepository: InventoryLevelRepository,
    protected productVariantRepository: ProductVariantRepository
  ) {}

  /**
   * Sets the available quantity of a tracked variant at each given location.
   * Callers authorize first (ProductPolicy.editInventory checks tracking).
   */
  async setLevels(variant: ProductVariant, levels: InventoryLevelData[]): Promise<ProductVariant> {
    await this.inventoryLevelRepository.setAvailable(variant, levels)
    return this.productVariantRepository.loadDetail(variant)
  }
}
