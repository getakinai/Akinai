import { DateTime } from 'luxon'
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import CollectionProduct from '#models/collection_product'
import CollectionRule from '#models/collection_rule'

export const COLLECTION_TYPES = ['manual', 'automated'] as const

export type CollectionType = (typeof COLLECTION_TYPES)[number]

export const COLLECTION_MATCHES = ['all', 'any'] as const

export type CollectionMatch = (typeof COLLECTION_MATCHES)[number]

export const COLLECTION_SORT_ORDERS = [
  'manual',
  'best_selling',
  'title_asc',
  'title_desc',
  'price_asc',
  'price_desc',
  'created_desc',
  'created_asc',
] as const

export type CollectionSortOrder = (typeof COLLECTION_SORT_ORDERS)[number]

export const COLLECTION_STATUSES = ['draft', 'active', 'archived'] as const

export type CollectionStatus = (typeof COLLECTION_STATUSES)[number]

/**
 * A group of products. Manual collections list hand-picked products in
 * `collection_products`; automated collections are defined by their rules
 * and resolved when queried.
 */
export default class Collection extends BaseAppModel {
  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare type: CollectionType

  @column()
  declare match: CollectionMatch

  @column()
  declare sortOrder: CollectionSortOrder

  /** Drive key of the cover photo shown on the storefront collection page. */
  @column()
  declare image: string | null

  @column()
  declare seoTitle: string | null

  @column()
  declare seoDescription: string | null

  @column()
  declare status: CollectionStatus

  @column.dateTime()
  declare archivedAt: DateTime | null

  @hasMany(() => CollectionRule)
  declare rules: HasMany<typeof CollectionRule>

  @hasMany(() => CollectionProduct)
  declare entries: HasMany<typeof CollectionProduct>

  get isManual() {
    return this.type === 'manual'
  }

  get isArchived() {
    return this.status === 'archived'
  }
}
