import type { DateTime } from 'luxon'
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { HelpIcon } from '#constants/help'
import BaseAppModel from '#models/base/base_app_model'
import HelpArticle from '#models/help_article'
import HelpCategoryGroup from '#models/help_category_group'

/**
 * A storefront help center topic (`/help/:slug`). Its `groups` split the
 * article list into headed sections.
 */
export default class HelpCategory extends BaseAppModel {
  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare icon: HelpIcon

  @column()
  declare popular: boolean

  @column()
  declare position: number

  @column.dateTime()
  declare archivedAt: DateTime | null

  @hasMany(() => HelpCategoryGroup)
  declare groups: HasMany<typeof HelpCategoryGroup>

  @hasMany(() => HelpArticle)
  declare articles: HasMany<typeof HelpArticle>

  get isArchived() {
    return this.archivedAt !== null
  }
}
