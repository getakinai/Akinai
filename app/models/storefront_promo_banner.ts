import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Collection from '#models/collection'
import Page from '#models/page'
import type { MenuItemType, PromoPlacement, PromoTone } from '#constants/storefront'

/**
 * A promo banner on the storefront home page, ordered by `position` within
 * its `placement`. Links to a collection, a page or a custom URL depending on
 * `type`. `image` is a drive key.
 */
export default class StorefrontPromoBanner extends BaseAppModel {
  @column()
  declare placement: PromoPlacement

  @column()
  declare eyebrow: string | null

  @column()
  declare title: string

  @column()
  declare buttonLabel: string | null

  @column()
  declare tone: PromoTone

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
