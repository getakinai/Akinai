import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import OptionDefinition from '#models/option_definition'
import ProductOptionValue from '#models/product_option_value'

/**
 * A variant dimension of a product, such as Size or Color.
 */
export default class ProductOption extends BaseAppModel {
  @column()
  declare productId: string

  @column()
  declare optionDefinitionId: string | null

  @column()
  declare name: string

  @column()
  declare position: number

  @belongsTo(() => OptionDefinition)
  declare definition: BelongsTo<typeof OptionDefinition>

  @hasMany(() => ProductOptionValue)
  declare values: HasMany<typeof ProductOptionValue>
}
