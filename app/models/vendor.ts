import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Product from '#models/product'

/**
 * Brand or supplier picked on the product form. Automated collections can
 * match on its name.
 */
export default class Vendor extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare isActive: boolean

  /** Drive key of the logo or cover shown in the store's Shop by brands carousel. */
  @column()
  declare image: string | null

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>
}
