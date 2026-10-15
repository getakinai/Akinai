import type { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import Collection, {
  type CollectionMatch,
  type CollectionSortOrder,
  type CollectionStatus,
  type CollectionType,
} from '#models/collection'
import CollectionProduct from '#models/collection_product'
import CollectionRule, { type CollectionRuleData } from '#models/collection_rule'
import Product from '#models/product'
import { productListRowQuery } from '#repositories/product_repository'
import { bulkUpdate, type BulkStatusSource } from '#repositories/helpers/bulk_update'
import { escapeLike } from '#repositories/helpers/like'

export type CollectionData = {
  title: string
  slug: string
  description: string | null
  type: CollectionType
  match: CollectionMatch
  sortOrder: CollectionSortOrder
  seoTitle: string | null
  seoDescription: string | null
  status: CollectionStatus
}

export type CollectionSortKey = 'title' | 'status' | 'createdAt' | 'updatedAt'

export type PaginateCollectionsData = {
  q?: string
  status?: CollectionStatus
  type?: CollectionType
  sort: CollectionSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

export type CollectionRuleSet = {
  rules: CollectionRuleData[]
  match: CollectionMatch
}

const sortColumns: Record<CollectionSortKey, string> = {
  title: 'title',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

const AVAILABLE_TOTAL_SQL = `(select coalesce(sum(il.available), 0)
  from inventory_levels il
  join product_variants pv on pv.id = il.product_variant_id
  where pv.product_id = products.id)`

const UNITS_SOLD_SQL = `(select coalesce(sum(oli.quantity), 0)
  from order_line_items oli
  join orders o on o.id = oli.order_id
  join product_variants pv on pv.id = oli.product_variant_id
  where pv.product_id = products.id and o.status = 'open')`

export default class CollectionRepository {
  async paginate({ q, status, type, sort, direction, page, perPage }: PaginateCollectionsData) {
    return Collection.query()
      .withCount('entries', (query) => query.as('entries_count'))
      .preload('rules', (rules) => rules.orderBy('position', 'asc'))
      .if(q, (query) => query.whereILike('title', `%${escapeLike(q!)}%`))
      .if(status, (query) => query.where('status', status!))
      .if(type, (query) => query.where('type', type!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<Collection> {
    return Collection.findOrFail(id)
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    return Collection.findBy('slug', slug)
  }

  async findWithRulesOrFail(id: string): Promise<Collection> {
    return Collection.query()
      .where('id', id)
      .withCount('entries', (query) => query.as('entries_count'))
      .preload('rules', (rules) => rules.orderBy('position', 'asc'))
      .firstOrFail()
  }

  async exportRows(
    { q, status, type, sort, direction }: Omit<PaginateCollectionsData, 'page' | 'perPage'>,
    limit: number
  ): Promise<Collection[]> {
    return Collection.query()
      .select(
        'id',
        'title',
        'slug',
        'description',
        'type',
        'match',
        'sort_order',
        'seo_title',
        'seo_description',
        'status',
        'created_at',
        'updated_at'
      )
      .preload('rules', (rules) =>
        rules.select('id', 'collection_id', 'field', 'operator', 'value').orderBy('position', 'asc')
      )
      .if(q, (query) => query.whereILike('title', `%${escapeLike(q!)}%`))
      .if(status, (query) => query.where('status', status!))
      .if(type, (query) => query.where('type', type!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .limit(limit)
  }

  async slugsIn(slugs: string[]): Promise<string[]> {
    if (slugs.length === 0) return []
    const rows = await Collection.query().whereIn('slug', slugs).select('slug')
    return rows.map(({ slug }) => slug)
  }

  /** Creates the collections and all their rules in one transaction. */
  async createManyWithRules(
    items: { data: CollectionData; rules: CollectionRuleData[] }[]
  ): Promise<Collection[]> {
    return db.transaction(async (trx) => {
      const collections = await Collection.createMany(
        items.map(({ data }) => data),
        { client: trx }
      )
      const rules = collections.flatMap((collection, index) =>
        items[index].rules.map(({ field, operator, value }, position) => ({
          collectionId: collection.id,
          field,
          operator,
          value,
          position,
        }))
      )
      if (rules.length > 0) await CollectionRule.createMany(rules, { client: trx })
      return collections
    })
  }

  async createWithRules(data: CollectionData, rules: CollectionRuleData[]): Promise<Collection> {
    return db.transaction(async (trx) => {
      const collection = await Collection.create(data, { client: trx })
      await this.writeRules(collection.id, rules, trx)
      return collection
    })
  }

  /**
   * Updates the collection and, when `rules` is given, replaces its rules
   * in the same transaction.
   */
  async updateWithRules(
    collection: Collection,
    data: Partial<CollectionData>,
    rules?: CollectionRuleData[]
  ): Promise<Collection> {
    return db.transaction(async (trx) => {
      collection.useTransaction(trx)
      await collection.merge(data).save()
      if (rules !== undefined) {
        await CollectionRule.query({ client: trx }).where('collection_id', collection.id).delete()
        await this.writeRules(collection.id, rules, trx)
      }
      return collection
    })
  }

  async setImage(collection: Collection, image: string | null): Promise<Collection> {
    return collection.merge({ image }).save()
  }

  async setStatus(
    collection: Collection,
    status: CollectionStatus,
    archivedAt: DateTime | null
  ): Promise<Collection> {
    return collection.merge({ status, archivedAt }).save()
  }

  /**
   * Sets the status of the collections in `ids` allowed by `from`, skipping
   * ones already at `status`. Returns the changed rows with their previous
   * values.
   */
  async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: CollectionStatus,
    archivedAt: DateTime | null
  ): Promise<Collection[]> {
    return bulkUpdate(Collection, ids, { status, archivedAt }, (query) =>
      query
        .if(from === 'archived', (scoped) => scoped.where('status', 'archived'))
        .if(from === 'unarchived', (scoped) => scoped.whereNot('status', 'archived'))
        .whereNot('status', status)
    )
  }

  /**
   * Products in the collection, as ProductTransformer list rows. Manual
   * collections list their entries (archived products included so staff can
   * remove them); automated collections resolve their rules and never
   * include archived products.
   */
  async paginateProducts(collection: Collection, page: number, perPage: number) {
    const query = productListRowQuery()

    if (collection.isManual) {
      query
        .join('collection_products', 'collection_products.product_id', 'products.id')
        .where('collection_products.collection_id', collection.id)
        .select('collection_products.position as collection_position')
    } else {
      query.whereNot('products.status', 'archived')
      this.applyRules(query, { rules: collection.rules, match: collection.match })
    }

    this.applySort(query, collection.sortOrder, collection.isManual)
    return query.paginate(page, perPage)
  }

  /**
   * Products matching unsaved rules, for the live preview in the editor.
   */
  async previewProducts(ruleSet: CollectionRuleSet, sortOrder: CollectionSortOrder, limit: number) {
    const query = productListRowQuery().whereNot('products.status', 'archived')
    this.applyRules(query, ruleSet)
    this.applySort(query, sortOrder, false)
    return query.paginate(1, limit)
  }

  async countMatching(ruleSet: CollectionRuleSet): Promise<number> {
    const query = Product.query().whereNot('products.status', 'archived')
    this.applyRules(query, ruleSet)
    const result = await query.count('* as total').first()
    return Number(result?.$extras.total ?? 0)
  }

  async entryProductIds(collectionId: string): Promise<string[]> {
    const rows = await CollectionProduct.query()
      .where('collection_id', collectionId)
      .orderBy('position', 'asc')
    return rows.map(({ productId }) => productId)
  }

  /**
   * Appends products that exist and aren't already in the collection.
   * Returns how many were added.
   */
  async addProducts(collectionId: string, productIds: string[]): Promise<number> {
    return db.transaction(async (trx) => {
      const existing = await CollectionProduct.query({ client: trx })
        .where('collection_id', collectionId)
        .select('product_id', 'position')
      const present = new Set(existing.map(({ productId }) => productId))
      const candidates = [...new Set(productIds)].filter((id) => !present.has(id))
      if (candidates.length === 0) return 0

      const found = await Product.query({ client: trx }).whereIn('id', candidates).select('id')
      const foundIds = new Set(found.map(({ id }) => id))
      const toAdd = candidates.filter((id) => foundIds.has(id))
      if (toAdd.length === 0) return 0

      let position = existing.reduce((max, entry) => Math.max(max, entry.position), -1) + 1
      await CollectionProduct.createMany(
        toAdd.map((productId) => ({ collectionId, productId, position: position++ })),
        { client: trx }
      )
      return toAdd.length
    })
  }

  /**
   * Returns false when the product wasn't in the collection.
   */
  async removeProduct(collectionId: string, productId: string): Promise<boolean> {
    const deleted: number | number[] = await CollectionProduct.query()
      .where('collection_id', collectionId)
      .where('product_id', productId)
      .delete()
    return Number(Array.isArray(deleted) ? deleted[0] : deleted) > 0
  }

  async setPositions(
    collectionId: string,
    changes: { productId: string; position: number }[]
  ): Promise<void> {
    await db.transaction(async (trx) => {
      for (const { productId, position } of changes) {
        await CollectionProduct.query({ client: trx })
          .where('collection_id', collectionId)
          .where('product_id', productId)
          .update({ position, updated_at: new Date() })
      }
    })
  }

  protected async writeRules(
    collectionId: string,
    rules: CollectionRuleData[],
    trx: TransactionClientContract
  ): Promise<void> {
    if (rules.length === 0) return
    await CollectionRule.createMany(
      rules.map(({ field, operator, value }, position) => ({
        collectionId,
        field,
        operator,
        value,
        position,
      })),
      { client: trx }
    )
  }

  applySort(
    query: ModelQueryBuilderContract<typeof Product>,
    sortOrder: CollectionSortOrder,
    isManual: boolean
  ) {
    switch (sortOrder) {
      case 'manual':
        if (isManual) query.orderBy('collection_products.position', 'asc')
        else query.orderBy('products.title', 'asc')
        break
      case 'best_selling':
        query.select(db.raw(`${UNITS_SOLD_SQL} as units_sold`)).orderBy('units_sold', 'desc')
        break
      case 'title_asc':
        query.orderBy('products.title', 'asc')
        break
      case 'title_desc':
        query.orderBy('products.title', 'desc')
        break
      case 'price_asc':
        query.orderByRaw('price_min asc nulls last')
        break
      case 'price_desc':
        query.orderByRaw('price_max desc nulls last')
        break
      case 'created_desc':
        query.orderBy('products.created_at', 'desc')
        break
      case 'created_asc':
        query.orderBy('products.created_at', 'asc')
        break
    }
    query.orderBy('products.id', 'asc')
  }

  /**
   * Adds the rule conditions as one grouped `WHERE`, joined with AND for
   * `match = all` and OR for `match = any`. Text comparisons ignore case.
   */
  applyRules(
    query: ModelQueryBuilderContract<typeof Product>,
    { rules, match }: CollectionRuleSet
  ): void {
    if (rules.length === 0) {
      query.whereRaw('false')
      return
    }

    query.where((group) => {
      for (const rule of rules) {
        if (match === 'all') group.where((sub) => this.applyRule(sub, rule))
        else group.orWhere((sub) => this.applyRule(sub, rule))
      }
    })
  }

  protected applyRule(
    query: ModelQueryBuilderContract<typeof Product>,
    { field, operator, value }: CollectionRuleData
  ) {
    const text = (value ?? '').trim().toLowerCase()
    const amount = Number(value ?? 0)

    switch (field) {
      case 'title':
        return this.textCondition(query, 'products.title', operator, text)
      case 'product_type':
        return this.relatedNameCondition(
          query,
          'product_types',
          'products.product_type_id',
          operator,
          text
        )
      case 'vendor':
        return this.relatedNameCondition(query, 'vendors', 'products.vendor_id', operator, text)
      case 'tag': {
        const hasTag = (sub: ModelQueryBuilderContract<typeof Product>) =>
          sub
            .from('product_tags')
            .whereColumn('product_tags.product_id', 'products.id')
            .where('product_tags.name', text)
        return operator === 'not_equals' ? query.whereNotExists(hasTag) : query.whereExists(hasTag)
      }
      case 'variant_price':
        return query.whereExists((sub) =>
          sub
            .from('product_variants')
            .whereColumn('product_variants.product_id', 'products.id')
            .where('product_variants.price', this.comparison(operator), amount)
        )
      case 'compare_at_price': {
        const onSale = (sub: ModelQueryBuilderContract<typeof Product>) =>
          sub
            .from('product_variants')
            .whereColumn('product_variants.product_id', 'products.id')
            .whereNotNull('product_variants.compare_at_price')
        if (operator === 'is_set') return query.whereExists(onSale)
        if (operator === 'is_not_set') return query.whereNotExists(onSale)
        return query.whereExists((sub) =>
          onSale(sub).where('product_variants.compare_at_price', this.comparison(operator), amount)
        )
      }
      case 'inventory_available':
        return query.whereRaw(`${AVAILABLE_TOTAL_SQL} ${this.comparison(operator)} ?`, [amount])
      case 'option_value': {
        const hasValue = (sub: ModelQueryBuilderContract<typeof Product>) =>
          sub
            .from('product_option_values')
            .join(
              'product_options',
              'product_options.id',
              'product_option_values.product_option_id'
            )
            .whereColumn('product_options.product_id', 'products.id')
            .whereRaw('lower(product_option_values.value) = ?', [text])
        return operator === 'not_equals'
          ? query.whereNotExists(hasValue)
          : query.whereExists(hasValue)
      }
    }
  }

  protected comparison(operator: CollectionRuleData['operator']): '>' | '<' | '=' {
    if (operator === 'greater_than') return '>'
    if (operator === 'less_than') return '<'
    return '='
  }

  /**
   * Compares the name of the linked product type or vendor. Negative
   * operators are "no linked record matches", so "vendor is not Acme" also
   * includes products without a vendor.
   */
  protected relatedNameCondition(
    query: ModelQueryBuilderContract<typeof Product>,
    table: 'product_types' | 'vendors',
    foreignKey: string,
    operator: CollectionRuleData['operator'],
    text: string
  ) {
    const positive =
      operator === 'not_equals' ? 'equals' : operator === 'not_contains' ? 'contains' : operator
    const matches = (sub: ModelQueryBuilderContract<typeof Product>) => {
      sub.from(table).whereColumn(`${table}.id`, foreignKey)
      this.textCondition(sub, `${table}.name`, positive, text)
    }
    return positive === operator ? query.whereExists(matches) : query.whereNotExists(matches)
  }

  protected textCondition(
    query: ModelQueryBuilderContract<typeof Product>,
    column: string,
    operator: CollectionRuleData['operator'],
    text: string
  ) {
    const like = escapeLike(text)

    switch (operator) {
      case 'equals':
        return query.whereRaw(`lower(${column}) = ?`, [text])
      case 'not_equals':
        return query.whereNot((sub) => sub.whereRaw(`lower(${column}) = ?`, [text]))
      case 'contains':
        return query.whereILike(column, `%${like}%`)
      case 'not_contains':
        return query.whereNot((sub) => sub.whereILike(column, `%${like}%`))
      case 'starts_with':
        return query.whereILike(column, `${like}%`)
      case 'ends_with':
        return query.whereILike(column, `%${like}`)
      default:
        return query
    }
  }
}
