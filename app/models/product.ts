import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import logger from '@adonisjs/core/services/logger'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { Searchable, type Builder } from '@foadonis/magnify'
import type { SearchableModel } from '@foadonis/magnify/types'
import BaseAppModel from '#models/base/base_app_model'
import ProductImage from '#models/product_image'
import ProductLabel from '#models/product_label'
import ProductOption from '#models/product_option'
import ProductReview from '#models/product_review'
import ProductTag from '#models/product_tag'
import ProductType from '#models/product_type'
import ProductVariant from '#models/product_variant'
import Vendor from '#models/vendor'

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

/**
 * Parent catalog record. Holds merchandising data only; price, SKU and stock
 * live on its variants.
 *
 * Indexed for storefront search (`products` index). Search documents are
 * written by ProductSearchService with tags preloaded.
 */
export default class Product extends compose(BaseAppModel, Searchable) {
  /**
   * Search hits keep the engine's relevance order instead of the
   * database's.
   */
  static $queryMagnifyModelsByIds<M extends SearchableModel>(
    this: M,
    _builder: Builder,
    ...ids: string[]
  ): Promise<InstanceType<M>[]> {
    const placeholders = ids.map(() => '?').join(',')
    return this.query()
      .whereIn('id', ids)
      .orderByRaw(`array_position(array[${placeholders}]::uuid[], id)`, ids)
      .exec() as Promise<InstanceType<M>[]>
  }

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  /** Search result title. Falls back to `title` when null. */
  @column()
  declare seoTitle: string | null

  /** Meta description. Falls back to the plain-text description when null. */
  @column()
  declare seoDescription: string | null

  @column()
  declare productTypeId: string | null

  @column()
  declare vendorId: string | null

  /** Badge shown over the cover photo in the storefront. */
  @column()
  declare productLabelId: string | null

  @column()
  declare status: ProductStatus

  /** False for products sold tax-free (e.g. gift cards). */
  @column()
  declare chargeTax: boolean

  /** A cart made only of these products gets its cheapest shipping rate free. */
  @column()
  declare freeShipping: boolean

  /** Drive key of the cover photo. */
  @column()
  declare coverImage: string | null

  @column.dateTime()
  declare archivedAt: DateTime | null

  @belongsTo(() => ProductType)
  declare productType: BelongsTo<typeof ProductType>

  @belongsTo(() => Vendor)
  declare vendor: BelongsTo<typeof Vendor>

  @belongsTo(() => ProductLabel)
  declare productLabel: BelongsTo<typeof ProductLabel>

  @hasMany(() => ProductTag)
  declare tags: HasMany<typeof ProductTag>

  @hasMany(() => ProductOption)
  declare options: HasMany<typeof ProductOption>

  @hasMany(() => ProductVariant)
  declare variants: HasMany<typeof ProductVariant>

  @hasMany(() => ProductImage)
  declare images: HasMany<typeof ProductImage>

  @hasMany(() => ProductReview)
  declare reviews: HasMany<typeof ProductReview>

  get isArchived() {
    return this.status === 'archived'
  }

  toSearchableObject() {
    return {
      title: this.title,
      description: this.description ?? '',
      tags: this.tags.map((tag) => tag.name),
      status: this.status,
      updatedAt: (this.updatedAt ?? this.createdAt).toMillis(),
    }
  }

  /**
   * Search engines replace the whole document on upsert, so only index
   * with tags loaded. This keeps Magnify's save hooks (which run on plain
   * `save()` without tags) from wiping a product's tags in the index.
   */
  shouldBeSearchable() {
    return this.$preloaded.tags !== undefined
  }

  async $makeUnsearchable() {
    try {
      await super.$makeUnsearchable()
    } catch (error) {
      logger.warn({ err: error, productId: this.id }, 'Failed to remove product from search index')
    }
  }
}
