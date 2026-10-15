import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import HelpArticle from '#models/help_article'

/** A "Related articles" link from one help article to another, in order. */
export default class HelpArticleRelated extends BaseAppModel {
  static table = 'help_article_related'

  static auditable = false

  @column()
  declare helpArticleId: string

  @column()
  declare relatedArticleId: string

  @column()
  declare position: number

  @belongsTo(() => HelpArticle, { foreignKey: 'relatedArticleId' })
  declare relatedArticle: BelongsTo<typeof HelpArticle>
}
