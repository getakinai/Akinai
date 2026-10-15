import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import HelpCategory from '#models/help_category'

/** A headed section inside a help category. */
export default class HelpCategoryGroup extends BaseAppModel {
  @column()
  declare helpCategoryId: string

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare position: number

  @belongsTo(() => HelpCategory)
  declare category: BelongsTo<typeof HelpCategory>
}
