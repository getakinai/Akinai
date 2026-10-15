import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

/**
 * A gallery photo of a product. `path` is the Drive key; the cover photo
 * lives on `products.cover_image` instead.
 */
export default class ProductImage extends BaseAppModel {
  @column()
  declare productId: string

  @column()
  declare path: string

  @column()
  declare position: number
}
