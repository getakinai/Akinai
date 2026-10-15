import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import type { Client as TypesenseClient } from 'typesense'
import Product, { type ProductStatus } from '#models/product'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import ProductRepository from '#repositories/product_repository'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'

export const SEARCH_RESULTS_LIMIT = 8
export const SEARCH_REINDEX_CHUNK = 100
export const ADMIN_SEARCH_MAX_HITS = 250

export type ProductSearchOptions = {
  status?: ProductStatus
  limit: number
}

/**
 * Keeps the `products` search index in step with the catalog and runs
 * storefront searches. The index only holds a reference to each product
 * (id, searchable text, status); cards are always read from the database.
 */
@inject()
export default class ProductSearchService {
  constructor(
    protected productRepository: ProductRepository,
    protected storefrontCatalogRepository: StorefrontCatalogRepository
  ) {}

  /**
   * Writes the current state of the given products to the index. Failures
   * are logged, not thrown: the index is rebuilt with
   * `node ace search:reindex-products`, and a search outage must never
   * block a catalog change.
   */
  async sync(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    try {
      const products = await this.productRepository.findManyForSearchIndex(ids)
      await Product.$makeSearchable(...products)
    } catch (error) {
      logger.warn({ err: error, productIds: ids }, 'Failed to sync products to search index')
    }
  }

  /**
   * The one product search query shared by the storefront and back office:
   * ids of products matching `query` (title, tags, description), best match
   * first, optionally limited to one status.
   */
  async ids(query: string, { status, limit }: ProductSearchOptions): Promise<string[]> {
    const builder = Product.search(query)
    if (status) builder.where('status', status)
    const page = await builder.paginate(limit, 1)
    return page.all().map((product: Product) => product.id)
  }

  /**
   * Active products matching `query`, best match first, as storefront cards.
   */
  async search(
    query: string,
    market: PriceMarket,
    limit = SEARCH_RESULTS_LIMIT
  ): Promise<Product[]> {
    const ids = await this.ids(query, { status: 'active', limit })

    const cards = await this.storefrontCatalogRepository.productCards(ids, market)
    const byId = new Map(cards.map((card) => [card.id, card]))
    return ids.flatMap((id) => byId.get(id) ?? [])
  }

  /**
   * Ids of products matching `query`, best match first, for the back-office
   * list. Returns `null` when the search engine is unreachable so callers
   * can fall back to a database match.
   */
  async matchingIds(
    query: string,
    status?: ProductStatus,
    limit = ADMIN_SEARCH_MAX_HITS
  ): Promise<string[] | null> {
    try {
      return await this.ids(query, { status, limit })
    } catch (error) {
      logger.warn({ err: error, query }, 'Product search failed, falling back to database')
      return null
    }
  }

  /**
   * Creates the `products` collection from `config/magnify.ts` when it is
   * missing. With `fresh`, drops it first so schema changes apply (Typesense
   * cannot alter an existing collection's settings). Engines without
   * collections (the test `memory` engine) are left alone.
   */
  async ensureIndex(fresh = false): Promise<'created' | 'exists' | 'skipped'> {
    const engine = await Product.$getSearchEngine()
    if (!('client' in engine) || !engine.syncIndexSettings) return 'skipped'

    const collection = (engine.client as TypesenseClient).collections(Product.$searchIndex)
    const exists = await collection.exists()
    if (exists && !fresh) return 'exists'
    if (exists) await collection.delete()

    await engine.syncIndexSettings()
    return 'created'
  }

  /**
   * Re-indexes every product in chunks. Returns how many were indexed.
   */
  async reindexAll(chunk = SEARCH_REINDEX_CHUNK): Promise<number> {
    let page = 1
    let total = 0
    for (;;) {
      const results = await this.productRepository.pageForSearchIndex(page, chunk)
      await Product.$makeSearchable(...results.all())
      total += results.all().length
      if (!results.hasMorePages) return total
      page++
    }
  }
}
