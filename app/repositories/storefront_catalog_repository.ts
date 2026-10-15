import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import Collection from '#models/collection'
import Product from '#models/product'
import type ProductLabel from '#models/product_label'
import Vendor from '#models/vendor'
import CollectionRepository from '#repositories/collection_repository'
import { productPriceSubqueries, type PriceMarket } from '#repositories/helpers/market_prices'
import type { StorefrontCollectionSort } from '#constants/storefront'

/** Selected values of one option; values match case-insensitively. */
export type OptionFilter = { name: string; values: string[] }

export type CollectionProductFilters = {
  priceMin?: number
  priceMax?: number
  vendorIds?: string[]
  productTypeIds?: string[]
  options?: OptionFilter[]
  inStock?: boolean
}

export type CollectionProductsPage = {
  page: number
  perPage: number
  sort: StorefrontCollectionSort
  direction: 'asc' | 'desc'
  filters?: CollectionProductFilters
}

export type FacetEntry = { id: string; name: string; count: number }

export type CollectionFacets = {
  price: { min: number | null; max: number | null }
  vendors: FacetEntry[]
  productTypes: FacetEntry[]
  options: { name: string; values: string[] }[]
}

/** Raw rows the option facet query returns before grouping. */
type OptionFacetRow = { name: string; value: string }

/** SQL condition: the variant aliased `alias` doesn't track stock or has some available. */
const variantInStockSql = (alias: string) =>
  `(${alias}.track_inventory = false or (select coalesce(sum(il.available), 0)
    from inventory_levels il where il.product_variant_id = ${alias}.id) > 0)`

/** Archived labels are hidden from the store. */
const activeLabel = (query: ModelQueryBuilderContract<typeof ProductLabel>) =>
  query.select('id', 'name', 'color').where('is_active', true)

/**
 * Read-only catalog queries for the public storefront. Only active
 * collections, products and vendors are ever returned.
 */
@inject()
export default class StorefrontCatalogRepository {
  constructor(protected collectionRepository: CollectionRepository) {}

  async activeCollections(): Promise<Collection[]> {
    return Collection.query()
      .where('status', 'active')
      .preload('rules', (rules) => rules.orderBy('position', 'asc'))
      .orderBy('title', 'asc')
  }

  /**
   * Collections staff can link from the menu. Drafts are included so a
   * link can be prepared before the collection goes live.
   */
  async linkableCollections(): Promise<Collection[]> {
    return Collection.query()
      .whereNot('status', 'archived')
      .select('id', 'title', 'slug', 'status')
      .orderBy('title', 'asc')
  }

  /**
   * Ids of up to `limit` active products (with at least one variant) per
   * collection, in each collection's sort order. Every collection has its
   * own rules and sort, so each becomes a subquery and all of them run as
   * one `UNION ALL` statement. Collections without products map to `[]`.
   */
  async collectionsProductIds(
    collections: Collection[],
    limit: number,
    market: PriceMarket
  ): Promise<Map<string, string[]>> {
    if (collections.length === 0) return new Map()

    const parts = collections.map((collection) => {
      const query = this.collectionProductsQuery(collection, market)
      this.collectionRepository.applySort(query, collection.sortOrder, collection.isManual)

      const { sql, bindings } = query.limit(limit).toSQL()
      return {
        sql: `select cast(? as text) as collection_id, array(select ranked.id from (${sql}) ranked) as product_ids`,
        bindings: [collection.id, ...bindings],
      }
    })

    const result = await db.rawQuery<{ rows: { collection_id: string; product_ids: string[] }[] }>(
      parts.map(({ sql }) => sql).join(' union all '),
      parts.flatMap(({ bindings }) => bindings)
    )
    return new Map(result.rows.map((row) => [row.collection_id, row.product_ids]))
  }

  async findActiveCollectionBySlug(slug: string): Promise<Collection | null> {
    return Collection.query()
      .where('slug', slug)
      .where('status', 'active')
      .preload('rules', (rules) => rules.orderBy('position', 'asc'))
      .first()
  }

  /**
   * One page of product ids in the collection, in the requested order.
   * Every sort ends on `products.id` so pages never repeat or skip a row.
   */
  async paginateCollectionProductIds(
    collection: Collection,
    { page, perPage, sort, direction, filters }: CollectionProductsPage,
    market: PriceMarket
  ) {
    const query = this.collectionProductsQuery(collection, market)
    if (filters) this.applyFilters(query, filters, market)

    switch (sort) {
      case 'featured':
        this.collectionRepository.applySort(query, collection.sortOrder, collection.isManual)
        break
      case 'price':
        query.orderByRaw(`price_min ${direction} nulls last`)
        break
      case 'title':
        query.orderBy('products.title', direction)
        break
      case 'newest':
        query.orderBy('products.created_at', direction)
        break
    }
    query.orderBy('products.id', 'asc')

    const result = await query.paginate(page, perPage)
    return {
      ids: result.all().map((product) => product.id),
      meta: result.getMeta(),
    }
  }

  /**
   * Active products with at least one variant that belong to the
   * collection (manual entries or rule matches), with the price extras
   * the sorts use. Selects ids only.
   */
  protected collectionProductsQuery(collection: Collection, market: PriceMarket) {
    const prices = productPriceSubqueries(market)
    const query = Product.query()
      .select('products.id')
      .select(db.raw(`${prices.priceMin.sql} as price_min`, prices.priceMin.bindings))
      .select(db.raw(`${prices.priceMax.sql} as price_max`, prices.priceMax.bindings))
      .where('products.status', 'active')
      .whereHas('variants', () => {})

    if (collection.isManual) {
      query
        .join('collection_products', 'collection_products.product_id', 'products.id')
        .where('collection_products.collection_id', collection.id)
    } else {
      this.collectionRepository.applyRules(query, {
        rules: collection.rules,
        match: collection.match,
      })
    }
    return query
  }

  /**
   * Narrows a collection products query to the shopper's filters. Several
   * vendors / types / values of one option match any of them; different
   * options (and in-stock) must all hold on the same variant. A price range
   * keeps products whose market price range overlaps it.
   */
  protected applyFilters(
    query: ModelQueryBuilderContract<typeof Product>,
    filters: CollectionProductFilters,
    market: PriceMarket
  ) {
    const prices = productPriceSubqueries(market)
    if (filters.priceMin !== undefined) {
      query.whereRaw(`${prices.priceMax.sql} >= ?`, [...prices.priceMax.bindings, filters.priceMin])
    }
    if (filters.priceMax !== undefined) {
      query.whereRaw(`${prices.priceMin.sql} <= ?`, [...prices.priceMin.bindings, filters.priceMax])
    }
    if (filters.vendorIds?.length) query.whereIn('products.vendor_id', filters.vendorIds)
    if (filters.productTypeIds?.length) {
      query.whereIn('products.product_type_id', filters.productTypeIds)
    }

    const conditions: string[] = []
    const bindings: (string | number)[] = []
    for (const option of filters.options ?? []) {
      if (option.values.length === 0) continue
      conditions.push(
        `exists (select 1 from product_variant_option_values fvov
          join product_option_values fpov on fpov.id = fvov.product_option_value_id
          join product_options fpo on fpo.id = fpov.product_option_id
          where fvov.product_variant_id = fv.id
            and lower(fpo.name) = ?
            and lower(fpov.value) in (${option.values.map(() => '?').join(', ')}))`
      )
      bindings.push(option.name.toLowerCase(), ...option.values.map((value) => value.toLowerCase()))
    }
    if (filters.inStock) {
      conditions.push(variantInStockSql('fv'))
    }
    if (conditions.length > 0) {
      query.whereRaw(
        `exists (select 1 from product_variants fv
          where fv.product_id = products.id and ${conditions.join(' and ')})`,
        bindings
      )
    }
    return query
  }

  /**
   * What the collection can be filtered by: its market price range, active
   * vendors and product types with product counts, and option names with
   * their values (names and values merged case-insensitively). Each facet
   * is one query over the collection's product ids; they run in parallel.
   */
  async collectionFacets(
    collection: Collection,
    market: PriceMarket,
    limit: number
  ): Promise<CollectionFacets> {
    const base = () => this.collectionProductsQuery(collection, market).toSQL()

    const priceQuery = (() => {
      const { sql, bindings } = base()
      return db.rawQuery<{ rows: { min: string | null; max: string | null }[] }>(
        `select min(p.price_min) as min, max(p.price_max) as max from (${sql}) p`,
        bindings
      )
    })()

    const facetQuery = (table: 'vendors' | 'product_types', column: string) => {
      const { sql, bindings } = base()
      return db.rawQuery<{ rows: { id: string; name: string; count: string | number }[] }>(
        `select f.id, f.name, count(distinct pr.id) as count
          from (${sql}) p
          join products pr on pr.id = p.id
          join ${table} f on f.id = pr.${column}
          where f.is_active = true
          group by f.id, f.name
          order by f.name asc
          limit ?`,
        [...bindings, limit]
      )
    }

    const optionsQuery = (() => {
      const { sql, bindings } = base()
      return db.rawQuery<{ rows: OptionFacetRow[] }>(
        `select min(po.name) as name, min(pov.value) as value
          from (${sql}) p
          join product_options po on po.product_id = p.id
          join product_option_values pov on pov.product_option_id = po.id
          group by lower(po.name), lower(pov.value)
          order by min(po.position) asc, lower(po.name) asc, min(pov.position) asc, lower(pov.value) asc
          limit ?`,
        [...bindings, limit * limit]
      )
    })()

    const [price, vendors, productTypes, options] = await Promise.all([
      priceQuery,
      facetQuery('vendors', 'vendor_id'),
      facetQuery('product_types', 'product_type_id'),
      optionsQuery,
    ])

    const toEntries = (rows: { id: string; name: string; count: string | number }[]) =>
      rows.map((row) => ({ id: row.id, name: row.name, count: Number(row.count) }))
    const toPrice = (value: string | null | undefined) =>
      value === null || value === undefined ? null : Number(value)

    return {
      price: { min: toPrice(price.rows[0]?.min), max: toPrice(price.rows[0]?.max) },
      vendors: toEntries(vendors.rows),
      productTypes: toEntries(productTypes.rows),
      options: this.groupOptionRows(options.rows, limit),
    }
  }

  protected groupOptionRows(rows: OptionFacetRow[], limit: number) {
    const groups = new Map<string, { name: string; values: string[] }>()
    for (const row of rows) {
      const key = row.name.toLowerCase()
      let group = groups.get(key)
      if (!group) {
        if (groups.size >= limit) continue
        group = { name: row.name, values: [] }
        groups.set(key, group)
      }
      if (group.values.length < limit) group.values.push(row.value)
    }
    return [...groups.values()]
  }

  /**
   * Product cards by id, priced in the market. Reads the `price_min`,
   * `compare_at_price` and `variant_id` (the cheapest variant) extras, which
   * are null when no variant has a price in the market, and preloads the
   * vendor, product type and active label. Order is not guaranteed.
   */
  async productCards(ids: string[], market: PriceMarket): Promise<Product[]> {
    if (ids.length === 0) return []
    const prices = productPriceSubqueries(market)
    return Product.query()
      .select('products.*')
      .select(db.raw(`${prices.priceMin.sql} as price_min`, prices.priceMin.bindings))
      .select(db.raw(`${prices.compareAt.sql} as compare_at_price`, prices.compareAt.bindings))
      .select(db.raw(`${prices.variantId.sql} as variant_id`, prices.variantId.bindings))
      .whereIn('products.id', ids)
      .preload('vendor')
      .preload('productType')
      .preload('productLabel', activeLabel)
  }

  /**
   * An active product with at least one variant, with everything its
   * detail page shows: vendor, product type, gallery, options and
   * variants with their option values. Outside the primary market each
   * variant also preloads its `marketPrices` row for the market (empty when
   * it has no price there).
   */
  async findActiveProductBySlug(slug: string, market: PriceMarket): Promise<Product | null> {
    return Product.query()
      .select(
        'id',
        'title',
        'slug',
        'description',
        'seo_title',
        'seo_description',
        'vendor_id',
        'product_type_id',
        'product_label_id',
        'cover_image'
      )
      .where('slug', slug)
      .where('status', 'active')
      .whereHas('variants', () => {})
      .preload('vendor', (vendor) => vendor.select('id', 'name'))
      .preload('productType', (type) => type.select('id', 'name'))
      .preload('productLabel', activeLabel)
      .preload('images', (images) =>
        images.select('id', 'product_id', 'path').orderBy('position', 'asc')
      )
      .preload('options', (options) =>
        options
          .select('id', 'product_id', 'name')
          .orderBy('position', 'asc')
          .preload('values', (values) =>
            values.select('id', 'product_option_id', 'value').orderBy('position', 'asc')
          )
      )
      .preload('variants', (variants) =>
        variants
          .select('id', 'product_id', 'title', 'price', 'compare_at_price')
          .orderBy('position', 'asc')
          .orderBy('id', 'asc')
          .preload('optionValues')
          .if(!market.isPrimary, (query) =>
            query.preload('marketPrices', (prices) => prices.where('market_id', market.id))
          )
      )
      .first()
  }

  /** The few fields a collection page's head tags need. No rules. */
  async findActiveCollectionSeoBySlug(slug: string): Promise<Collection | null> {
    return Collection.query()
      .select('id', 'title', 'slug', 'description', 'seo_title', 'seo_description', 'image')
      .where('slug', slug)
      .where('status', 'active')
      .first()
  }

  /**
   * The few fields the product page's head tags need, in one query: the
   * `price_min` / `price_max` extras (null when no variant has a price in
   * the market), `in_stock`, and `rating_count` / `rating_avg` over visible
   * reviews, plus the vendor name and gallery paths.
   */
  async findActiveProductSeoBySlug(slug: string, market: PriceMarket): Promise<Product | null> {
    const prices = productPriceSubqueries(market)
    return Product.query()
      .select(
        'products.id',
        'products.title',
        'products.slug',
        'products.description',
        'products.seo_title',
        'products.seo_description',
        'products.vendor_id',
        'products.cover_image'
      )
      .select(
        db.raw(`${prices.priceMin.sql} as price_min`, prices.priceMin.bindings),
        db.raw(`${prices.priceMax.sql} as price_max`, prices.priceMax.bindings),
        db.raw(
          `exists (select 1 from product_variants sv
            where sv.product_id = products.id and ${variantInStockSql('sv')}) as in_stock`
        ),
        db.raw(
          `(select count(*) from product_reviews pr
            where pr.product_id = products.id and pr.is_hidden = false) as rating_count`
        ),
        db.raw(
          `(select avg(pr.rating) from product_reviews pr
            where pr.product_id = products.id and pr.is_hidden = false) as rating_avg`
        )
      )
      .where('products.slug', slug)
      .where('products.status', 'active')
      .whereHas('variants', () => {})
      .preload('vendor', (vendor) => vendor.select('id', 'name'))
      .preload('images', (images) =>
        images.select('id', 'product_id', 'path').orderBy('position', 'asc')
      )
      .first()
  }

  /** Id of an active product with at least one variant, or null. */
  async findActiveProductIdBySlug(slug: string): Promise<string | null> {
    const product = await Product.query()
      .select('id')
      .where('slug', slug)
      .where('status', 'active')
      .whereHas('variants', () => {})
      .first()
    return product?.id ?? null
  }

  /**
   * Active vendors that have at least one active product.
   */
  async activeVendors(limit: number): Promise<Vendor[]> {
    return Vendor.query()
      .where('is_active', true)
      .whereHas('products', (products) => products.where('status', 'active'))
      .orderBy('name', 'asc')
      .limit(limit)
  }
}
