import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Collection from '#models/collection'
import Page from '#models/page'
import type { MenuItemType } from '#constants/storefront'

/**
 * A link in the storefront header menu, ordered by `position`. Points at a
 * collection, a page or a custom URL depending on `type`.
 */
export default class StorefrontMenuItem extends BaseAppModel {
  @column()
  declare label: string

  @column()
  declare type: MenuItemType

  @column()
  declare collectionId: string | null

  @column()
  declare pageId: string | null

  @column()
  declare url: string | null

  @column()
  declare position: number

  @column()
  declare isVisible: boolean

  @belongsTo(() => Collection)
  declare collection: BelongsTo<typeof Collection>

  @belongsTo(() => Page)
  declare page: BelongsTo<typeof Page>
}
