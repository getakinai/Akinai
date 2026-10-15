import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import OptionDefinitionValue from '#models/option_definition_value'
import ProductOption from '#models/product_option'

export default class ProductOptionValue extends BaseAppModel {
  @column()
  declare productOptionId: string

  @column()
  declare optionDefinitionValueId: string | null

  @column()
  declare value: string

  @belongsTo(() => OptionDefinitionValue)
  declare definitionValue: BelongsTo<typeof OptionDefinitionValue>

  @column()
  declare position: number

  @belongsTo(() => ProductOption)
  declare option: BelongsTo<typeof ProductOption>
}
