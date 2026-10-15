import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Product from '#models/product'

/**
 * Kind of product (Gift box, Snacks…) picked on the product form.
 * Automated collections can match on its name.
 */
export default class ProductType extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>
}
