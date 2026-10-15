import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Location from '#models/location'
import ProductVariant from '#models/product_variant'

/**
 * Stock of one variant at one location. Only `available` is edited for now;
 * `committed` and `incoming` are reserved for orders and purchasing.
 */
export default class InventoryLevel extends BaseAppModel {
  @column()
  declare productVariantId: string

  @column()
  declare locationId: string

  @column()
  declare available: number

  @column()
  declare committed: number

  @column()
  declare incoming: number

  @belongsTo(() => ProductVariant)
  declare variant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => Location)
  declare location: BelongsTo<typeof Location>
}
