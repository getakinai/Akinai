import { inject } from '@adonisjs/core'
import { errors as lucidErrors } from '@adonisjs/lucid'
import type Product from '#models/product'
import type { PriceMarket } from '#repositories/helpers/market_prices'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'

/**
 * Public product pages. Only active products with at least one variant
 * are visible; drafts, archived and unknown slugs are a 404.
 */
@inject()
export default class StorefrontProductService {
  constructor(protected storefrontCatalogRepository: StorefrontCatalogRepository) {}

  async findBySlugOrFail(slug: string, market: PriceMarket): Promise<Product> {
    const product = await this.storefrontCatalogRepository.findActiveProductBySlug(slug, market)
    if (!product) throw new lucidErrors.E_ROW_NOT_FOUND()
    return product
  }

  async findIdBySlugOrFail(slug: string): Promise<string> {
    const id = await this.storefrontCatalogRepository.findActiveProductIdBySlug(slug)
    if (!id) throw new lucidErrors.E_ROW_NOT_FOUND()
    return id
  }
}
