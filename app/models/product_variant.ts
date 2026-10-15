import { belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import InventoryLevel from '#models/inventory_level'
import Product from '#models/product'
import ProductOptionValue from '#models/product_option_value'
import ProductVariantPrice from '#models/product_variant_price'

const toNumber = (value: string | number | null) => (value === null ? null : Number(value))

/**
 * A purchasable combination of option values. Price, SKU and stock are
 * tracked here, never on the parent product.
 */
export default class ProductVariant extends BaseAppModel {
  @column()
  declare productId: string

  @column()
  declare title: string

  @column()
  declare sku: string | null

  @column()
  declare barcode: string | null

  @column({ consume: (value) => Number(value) })
  declare price: number

  @column({ consume: toNumber })
  declare compareAtPrice: number | null

  /** In the store's weight unit (`store_settings.weight_unit`). */
  @column({ consume: toNumber })
  declare weight: number | null

  @column()
  declare trackInventory: boolean

  @column()
  declare position: number

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @manyToMany(() => ProductOptionValue, {
    pivotTable: 'product_variant_option_values',
    pivotForeignKey: 'product_variant_id',
    pivotRelatedForeignKey: 'product_option_value_id',
  })
  declare optionValues: ManyToMany<typeof ProductOptionValue>

  @hasMany(() => InventoryLevel)
  declare inventoryLevels: HasMany<typeof InventoryLevel>

  @hasMany(() => ProductVariantPrice)
  declare marketPrices: HasMany<typeof ProductVariantPrice>
}
