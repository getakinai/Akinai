import { inject } from '@adonisjs/core'
import { errors as lucidErrors } from '@adonisjs/lucid'
import type Collection from '#models/collection'
import type Product from '#models/product'
import { STOREFRONT_COLLECTION_PER_PAGE, STOREFRONT_FACET_LIMIT } from '#constants/storefront'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import StorefrontCatalogRepository, {
  type CollectionProductFilters,
  type CollectionProductsPage,
  type OptionFilter,
} from '#repositories/storefront_catalog_repository'

/** Filter values as they arrive from the products list query string. */
export type CollectionFilterInput = {
  priceMin?: number
  priceMax?: number
  vendor?: string[]
  type?: string[]
  option?: string[]
  inStock?: boolean
}

/**
 * Public collection pages. Only active collections are visible; drafts,
 * archived and unknown slugs are a 404.
 */
@inject()
export default class StorefrontCollectionService {
  constructor(protected storefrontCatalogRepository: StorefrontCatalogRepository) {}

  async findBySlugOrFail(slug: string): Promise<Collection> {
    const collection = await this.storefrontCatalogRepository.findActiveCollectionBySlug(slug)
    if (!collection) throw new lucidErrors.E_ROW_NOT_FOUND()
    return collection
  }

  /**
   * One page of product cards in the requested order: an id query, then
   * one card query, re-ordered in memory.
   */
  async paginateProducts(
    slug: string,
    options: Omit<CollectionProductsPage, 'perPage'>,
    market: PriceMarket
  ) {
    const collection = await this.findBySlugOrFail(slug)
    const { ids, meta } = await this.storefrontCatalogRepository.paginateCollectionProductIds(
      collection,
      { ...options, perPage: STOREFRONT_COLLECTION_PER_PAGE },
      market
    )
    const cards = await this.storefrontCatalogRepository.productCards(ids, market)
    const byId = new Map(cards.map((product) => [product.id, product]))

    const products: Product[] = ids.flatMap((id) => byId.get(id) ?? [])
    return { products, meta }
  }

  /** What the collection's products can be filtered by. */
  async facets(slug: string, market: PriceMarket) {
    const collection = await this.findBySlugOrFail(slug)
    return this.storefrontCatalogRepository.collectionFacets(
      collection,
      market,
      STOREFRONT_FACET_LIMIT
    )
  }

  /**
   * Turns query-string filters into repository filters. `Size:M` entries
   * are split on the first colon and grouped by option name
   * (case-insensitive); a swapped min/max price range is put back in order.
   */
  toFilters(input: CollectionFilterInput): CollectionProductFilters {
    let { priceMin, priceMax } = input
    if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
      ;[priceMin, priceMax] = [priceMax, priceMin]
    }

    const options = new Map<string, OptionFilter>()
    for (const entry of input.option ?? []) {
      const separator = entry.indexOf(':')
      const name = entry.slice(0, separator).trim()
      const value = entry.slice(separator + 1).trim()
      if (separator < 1 || !name || !value) continue
      const key = name.toLowerCase()
      const group = options.get(key) ?? { name, values: [] }
      if (!group.values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
        group.values.push(value)
      }
      options.set(key, group)
    }

    return {
      priceMin,
      priceMax,
      vendorIds: input.vendor,
      productTypeIds: input.type,
      options: [...options.values()],
      inStock: input.inStock,
    }
  }
}
