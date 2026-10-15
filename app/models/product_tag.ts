import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

/**
 * A merchandising label on a product. Names are stored trimmed and
 * lowercased so collection rules match regardless of how staff typed them.
 */
export default class ProductTag extends BaseAppModel {
  @column()
  declare productId: string

  @column()
  declare name: string
}
