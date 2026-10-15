import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Product from '#models/product'

/**
 * A hand-picked product in a manual collection, ordered by `position`.
 */
export default class CollectionProduct extends BaseAppModel {
  @column()
  declare collectionId: string

  @column()
  declare productId: string

  @column()
  declare position: number

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
