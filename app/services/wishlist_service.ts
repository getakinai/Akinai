import { inject } from '@adonisjs/core'
import { errors as lucidErrors } from '@adonisjs/lucid'
import BusinessRuleException from '#exceptions/business_rule_exception'
import type Product from '#models/product'
import { MAX_WISHLIST_ITEMS } from '#models/wishlist_item'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'
import WishlistRepository from '#repositories/wishlist_repository'

export const WISHLIST_PER_PAGE = 24

/**
 * A signed-in customer's saved products. Every method takes the session
 * customer's id; only active products can be saved or listed.
 */
@inject()
export default class WishlistService {
  constructor(
    protected wishlistRepository: WishlistRepository,
    protected storefrontCatalogRepository: StorefrontCatalogRepository
  ) {}

  async productIdsFor(customerId: string): Promise<string[]> {
    return this.wishlistRepository.productIdsFor(customerId)
  }

  /**
   * One page of saved products as storefront cards priced in the market:
   * an id query, then one card query, re-ordered in memory.
   */
  async paginateFor(customerId: string, page: number, market: PriceMarket) {
    const { ids, meta } = await this.wishlistRepository.paginateProductIdsFor(
      customerId,
      page,
      WISHLIST_PER_PAGE
    )
    const cards = await this.storefrontCatalogRepository.productCards(ids, market)
    const byId = new Map(cards.map((product) => [product.id, product]))
    const products: Product[] = ids.flatMap((id) => byId.get(id) ?? [])
    return { products, meta }
  }

  /** Saving a product twice is a no-op. Unknown or inactive products are a 404. */
  async add(customerId: string, productId: string): Promise<void> {
    if (!(await this.wishlistRepository.isActiveProduct(productId))) {
      throw new lucidErrors.E_ROW_NOT_FOUND()
    }
    const result = await this.wishlistRepository.add(customerId, productId)
    if (result === 'full') {
      throw new BusinessRuleException(
        `Your wishlist can hold up to ${MAX_WISHLIST_ITEMS} products. Remove some to save more.`
      )
    }
  }

  /** 404 when the product isn't in this customer's wishlist. */
  async remove(customerId: string, productId: string): Promise<void> {
    const item = await this.wishlistRepository.findForCustomer(customerId, productId)
    if (!item) throw new lucidErrors.E_ROW_NOT_FOUND()
    await this.wishlistRepository.remove(item)
  }
}
