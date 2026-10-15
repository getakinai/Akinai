import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import InventoryLevel from '#models/inventory_level'

/**
 * A place where stock is held: warehouse, retail store, 3PL site.
 */
export default class Location extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare addressLine: string | null

  @column()
  declare city: string | null

  @column()
  declare country: string | null

  @column()
  declare isActive: boolean

  @column()
  declare isDefault: boolean

  @hasMany(() => InventoryLevel)
  declare inventoryLevels: HasMany<typeof InventoryLevel>
}
