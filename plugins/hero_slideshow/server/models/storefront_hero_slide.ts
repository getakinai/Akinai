import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Collection from '#models/collection'
import Page from '#models/page'
import type { MenuItemType } from '#constants/storefront'

/**
 * A slide in the storefront home hero, ordered by `position`. Links to a
 * collection or a custom URL depending on `type`. `image` is a drive key.
 */
export default class StorefrontHeroSlide extends BaseAppModel {
  @column()
  declare eyebrow: string | null

  @column()
  declare heading: string

  @column()
  declare subheading: string | null

  @column()
  declare buttonLabel: string | null

  @column()
  declare type: MenuItemType

  @column()
  declare collectionId: string | null

  @column()
  declare pageId: string | null

  @column()
  declare url: string | null

  @column()
  declare image: string | null

  @column()
  declare position: number

  @column()
  declare isVisible: boolean

  @belongsTo(() => Collection)
  declare collection: BelongsTo<typeof Collection>

  @belongsTo(() => Page)
  declare page: BelongsTo<typeof Page>
}
