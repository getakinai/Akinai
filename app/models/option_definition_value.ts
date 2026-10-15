import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import OptionDefinition from '#models/option_definition'

export default class OptionDefinitionValue extends BaseAppModel {
  @column()
  declare optionDefinitionId: string

  @column()
  declare value: string

  @column()
  declare position: number

  @belongsTo(() => OptionDefinition)
  declare definition: BelongsTo<typeof OptionDefinition>
}
