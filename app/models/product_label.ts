import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Product from '#models/product'

export const PRODUCT_LABEL_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'black',
] as const

export type ProductLabelColor = (typeof PRODUCT_LABEL_COLORS)[number]

/**
 * Merchandising badge (New, Hot, Trending…) picked on the product form and
 * shown over the product's cover photo in the storefront. Colors come from
 * a fixed palette so the storefront maps them to theme classes.
 */
export default class ProductLabel extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare color: ProductLabelColor

  @column()
  declare isActive: boolean

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>
}
