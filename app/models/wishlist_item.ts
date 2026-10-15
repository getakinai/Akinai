import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Product from '#models/product'

/** Most products one customer can save. */
export const MAX_WISHLIST_ITEMS = 200

/**
 * Product a customer saved to their wishlist. One row per customer and
 * product. Activity entries are labelled with the product's title.
 */
export default class WishlistItem extends BaseAppModel {
  @column()
  declare customerId: string

  @column()
  declare productId: string

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
