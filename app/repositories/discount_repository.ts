import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import Collection from '#models/collection'
import CollectionProduct from '#models/collection_product'
import Discount, {
  type DiscountAppliesTo,
  type DiscountBuyRequirement,
  type DiscountMethod,
  type DiscountStatus,
  type DiscountType,
  type DiscountValueType,
} from '#models/discount'
import DiscountTarget, { type DiscountTargetRole } from '#models/discount_target'
import Product from '#models/product'
import CollectionRepository from '#repositories/collection_repository'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type DiscountData = {
  title: string
  type: DiscountType
  code: string | null
  method: DiscountMethod
  valueType: DiscountValueType
  value: number | null
  appliesTo: DiscountAppliesTo | null
  buyRequirement: DiscountBuyRequirement | null
  buyValue: number | null
  buyAppliesTo: DiscountAppliesTo | null
  getQuantity: number | null
  maxUsesPerOrder: number | null
  maxShippingPrice: number | null
  minSubtotal: number | null
  usageLimit: number | null
  oncePerCustomer: boolean
  startsAt: DateTime
  endsAt: DateTime | null
}

export type DiscountTargetData = {
  role: DiscountTargetRole
  productId: string | null
  collectionId: string | null
}

export type DiscountSortKey = 'title' | 'startsAt' | 'createdAt'

export type PaginateDiscountsData = {
  q?: string
  status?: DiscountStatus
  type?: DiscountType
  sort: DiscountSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

/** Automatic discounts checked per checkout quote; the oldest beyond this are ignored. */
const MAX_AUTOMATIC_DISCOUNTS = 25

const sortColumns: Record<DiscountSortKey, string> = {
  title: 'title',
  startsAt: 'starts_at',
  createdAt: 'created_at',
}

/**
 * Mirrors `Discount.statusAt()` in SQL.
 */
function whereStatus(
  query: ModelQueryBuilderContract<typeof Discount>,
  status: DiscountStatus,
  at: DateTime
) {
  const now = at.toJSDate()

  if (status === 'archived') {
    query.whereNotNull('archived_at')
    return
  }

  query.whereNull('archived_at')

  if (status === 'scheduled') {
    query.where('starts_at', '>', now)
    return
  }

  query.where('starts_at', '<=', now)

  if (status === 'expired') {
    query.where((group) => {
      group
        .where((ended) => ended.whereNotNull('ends_at').where('ends_at', '<=', now))
        .orWhere((usedUp) =>
          usedUp.whereNotNull('usage_limit').whereRaw('usage_count >= usage_limit')
        )
    })
    return
  }

  query
    .where((group) => group.whereNull('ends_at').orWhere('ends_at', '>', now))
    .where((group) => group.whereNull('usage_limit').orWhereRaw('usage_count < usage_limit'))
}

function preloadTargetTitles(query: ModelQueryBuilderContract<typeof Discount>) {
  query.preload('targets', (targets) => {
    targets
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
      .preload('product', (product) => product.select('id', 'title'))
      .preload('collection', (collection) => collection.select('id', 'title'))
  })
}

@inject()
export default class DiscountRepository {
  constructor(protected collectionRepository: CollectionRepository) {}

  async paginate({ q, status, type, sort, direction, page, perPage }: PaginateDiscountsData) {
    return Discount.query()
      .if(q, (query) => {
        query.where((group) => {
          group.whereILike('title', containsPattern(q)).orWhereILike('code', containsPattern(q))
        })
      })
      .if(status, (query) => whereStatus(query, status!, DateTime.now()))
      .if(type, (query) => query.where('type', type!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  /** The discount with its targets (and their titles) loaded. */
  async findOrFail(id: string): Promise<Discount> {
    const query = Discount.query().where('id', id)
    preloadTargetTitles(query)
    return query.firstOrFail()
  }

  /** The discount with its targets, or null when it was deleted. */
  async find(id: string): Promise<Discount | null> {
    return Discount.query().where('id', id).preload('targets').first()
  }

  async findActiveByCode(code: string, at: DateTime): Promise<Discount | null> {
    const query = Discount.query().where('method', 'code').where('code', code).preload('targets')
    whereStatus(query, 'active', at)
    return query.first()
  }

  /** Active automatic discounts with their targets, newest first. */
  async activeAutomatic(at: DateTime): Promise<Discount[]> {
    const query = Discount.query().where('method', 'automatic').preload('targets')
    whereStatus(query, 'active', at)
    return query.orderBy('created_at', 'desc').limit(MAX_AUTOMATIC_DISCOUNTS)
  }

  /** How many of `productIds` / `collectionIds` exist, to check new targets. */
  async countExistingTargets(productIds: string[], collectionIds: string[]) {
    const [products, collections] = await Promise.all([
      productIds.length > 0
        ? Product.query().whereIn('id', productIds).count('* as total').first()
        : null,
      collectionIds.length > 0
        ? Collection.query().whereIn('id', collectionIds).count('* as total').first()
        : null,
    ])
    return {
      products: Number(products?.$extras.total ?? 0),
      collections: Number(collections?.$extras.total ?? 0),
    }
  }

  /**
   * Which of `productIds` belong to each of `collectionIds`. Manual
   * collections are read from `collection_products` in one query; automated
   * ones run their rules limited to `productIds` (one query each, bounded by
   * the discount target caps).
   */
  async collectionMembership(
    collectionIds: string[],
    productIds: string[]
  ): Promise<Map<string, Set<string>>> {
    const membership = new Map<string, Set<string>>()
    if (collectionIds.length === 0 || productIds.length === 0) return membership

    const collections = await Collection.query()
      .whereIn('id', collectionIds)
      .whereNot('status', 'archived')
      .preload('rules')
    const manualIds = collections.filter((c) => c.isManual).map((c) => c.id)
    const automated = collections.filter((c) => !c.isManual)

    const [entries, ...ruleMatches] = await Promise.all([
      manualIds.length > 0
        ? CollectionProduct.query()
            .whereIn('collection_id', manualIds)
            .whereIn('product_id', productIds)
            .select('collection_id', 'product_id')
        : Promise.resolve([] as CollectionProduct[]),
      ...automated.map((collection) => {
        const query = Product.query()
          .whereIn('products.id', productIds)
          .whereNot('products.status', 'archived')
          .select('products.id')
        this.collectionRepository.applyRules(query, {
          rules: collection.rules,
          match: collection.match,
        })
        return query
      }),
    ])

    for (const entry of entries) {
      const set = membership.get(entry.collectionId) ?? new Set<string>()
      set.add(entry.productId)
      membership.set(entry.collectionId, set)
    }
    automated.forEach((collection, index) => {
      membership.set(collection.id, new Set(ruleMatches[index].map(({ id }) => id)))
    })
    return membership
  }

  async create(data: DiscountData, targets: DiscountTargetData[]): Promise<Discount> {
    const discount = await db.transaction(async (trx) => {
      const created = await Discount.create(
        { usageCount: 0, archivedAt: null, ...data },
        { client: trx }
      )
      if (targets.length > 0) {
        await DiscountTarget.createMany(
          targets.map((target) => ({ ...target, discountId: created.id })),
          { client: trx }
        )
      }
      return created
    })
    return this.findOrFail(discount.id)
  }

  async update(
    discount: Discount,
    data: DiscountData,
    targets: DiscountTargetData[]
  ): Promise<Discount> {
    await db.transaction(async (trx) => {
      discount.useTransaction(trx)
      await discount.merge(data).save()
      await DiscountTarget.query({ client: trx }).where('discount_id', discount.id).delete()
      if (targets.length > 0) {
        await DiscountTarget.createMany(
          targets.map((target) => ({ ...target, discountId: discount.id })),
          { client: trx }
        )
      }
    })
    return this.findOrFail(discount.id)
  }

  async setArchivedAt(discount: Discount, archivedAt: DateTime | null): Promise<Discount> {
    await discount.merge({ archivedAt }).save()
    return this.findOrFail(discount.id)
  }

  /**
   * Archives or restores the discounts in `ids`, skipping ones already in
   * that state. Returns the changed rows as they were.
   */
  async setArchivedAtMany(ids: string[], archivedAt: DateTime | null): Promise<Discount[]> {
    return bulkUpdate(Discount, ids, { archivedAt }, (query) =>
      archivedAt ? query.whereNull('archived_at') : query.whereNotNull('archived_at')
    )
  }
}
