import type { DateTime } from 'luxon'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { HelpArticleStatus } from '#constants/help'
import BaseAppModel from '#models/base/base_app_model'
import HelpArticleRelated from '#models/help_article_related'
import HelpCategory from '#models/help_category'
import HelpCategoryGroup from '#models/help_category_group'

const jsonColumn = { prepare: (value: string[]) => JSON.stringify(value) }

/**
 * A storefront help guide. Staff write `bodyMarkdown`; the sanitized HTML,
 * plain text and paragraphs (quoted by the help chat) are rendered from it
 * on save.
 */
export default class HelpArticle extends BaseAppModel {
  static auditHidden = ['bodyHtml', 'bodyText', 'bodyParagraphs']

  @column()
  declare helpCategoryId: string

  @column()
  declare helpCategoryGroupId: string | null

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column(jsonColumn)
  declare keywords: string[]

  @column()
  declare bodyMarkdown: string

  @column()
  declare bodyHtml: string

  @column()
  declare bodyText: string

  @column(jsonColumn)
  declare bodyParagraphs: string[]

  @column()
  declare popular: boolean

  @column()
  declare position: number

  @column()
  declare ctaLabel: string | null

  @column()
  declare ctaHref: string | null

  @column()
  declare status: HelpArticleStatus

  @column.dateTime()
  declare archivedAt: DateTime | null

  @belongsTo(() => HelpCategory)
  declare category: BelongsTo<typeof HelpCategory>

  @belongsTo(() => HelpCategoryGroup)
  declare group: BelongsTo<typeof HelpCategoryGroup>

  @hasMany(() => HelpArticleRelated)
  declare relatedLinks: HasMany<typeof HelpArticleRelated>

  get isArchived() {
    return this.status === 'archived'
  }
}
