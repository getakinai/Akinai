import { inject } from '@adonisjs/core'
import type Collection from '#models/collection'
import type Product from '#models/product'
import type Vendor from '#models/vendor'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'
import StorefrontMenuItemRepository from '#repositories/storefront_menu_item_repository'

export const HOME_COLLECTIONS_LIMIT = 6
export const HOME_PRODUCTS_PER_COLLECTION = 8
export const HOME_VENDORS_LIMIT = 12
/** Collections checked for products; empty ones are skipped. */
export const HOME_CANDIDATE_COLLECTIONS = 30

export type StorefrontHomeRail = { collection: Collection; products: Product[] }

export type StorefrontHome = {
  collections: StorefrontHomeRail[]
  vendors: Vendor[]
}

@inject()
export default class StorefrontHomeService {
  constructor(
    protected storefrontCatalogRepository: StorefrontCatalogRepository,
    protected storefrontMenuItemRepository: StorefrontMenuItemRepository
  ) {}

  /**
   * Product rails for the home page. Collections linked from the menu come
   * first, in menu order, so every collection menu link has a rail to jump
   * to. Collections without products are skipped.
   */
  async get(market: PriceMarket): Promise<StorefrontHome> {
    const [collections, menuItems, vendors] = await Promise.all([
      this.storefrontCatalogRepository.activeCollections(),
      this.storefrontMenuItemRepository.listPublic(),
      this.storefrontCatalogRepository.activeVendors(HOME_VENDORS_LIMIT),
    ])

    const menuOrder = new Map<string, number>()
    for (const item of menuItems) {
      if (item.collectionId && !menuOrder.has(item.collectionId)) {
        menuOrder.set(item.collectionId, menuOrder.size)
      }
    }
    const ordered = [...collections].sort(
      (a, b) =>
        (menuOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (menuOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    )

    const candidates = ordered.slice(0, HOME_CANDIDATE_COLLECTIONS)
    const productIds = await this.storefrontCatalogRepository.collectionsProductIds(
      candidates,
      HOME_PRODUCTS_PER_COLLECTION,
      market
    )
    const railIds = candidates
      .map((collection) => ({ collection, ids: productIds.get(collection.id) ?? [] }))
      .filter(({ ids }) => ids.length > 0)
      .slice(0, HOME_COLLECTIONS_LIMIT)

    const products = await this.storefrontCatalogRepository.productCards(
      [...new Set(railIds.flatMap(({ ids }) => ids))],
      market
    )
    const byId = new Map(products.map((product) => [product.id, product]))

    const rails = railIds.map(({ collection, ids }) => ({
      collection,
      products: ids.flatMap((id) => byId.get(id) ?? []),
    }))

    return { collections: rails, vendors }
  }
}
