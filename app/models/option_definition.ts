import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import OptionDefinitionValue from '#models/option_definition_value'

/**
 * Store-wide option name (Size, Color) whose values products can pick from.
 */
export default class OptionDefinition extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare position: number

  @column()
  declare isActive: boolean

  @hasMany(() => OptionDefinitionValue)
  declare values: HasMany<typeof OptionDefinitionValue>
}
