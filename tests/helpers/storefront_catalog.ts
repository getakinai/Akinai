import { randomBytes } from 'node:crypto'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import { CATALOG_NONCE_SESSION_KEY, CATALOG_TOKEN_HEADER } from '#constants/storefront'
import Collection, { type CollectionStatus } from '#models/collection'
import type Product from '#models/product'
import CollectionService from '#services/collection_service'
import MarketService from '#services/market_service'
import ProductService from '#services/product_service'
import StorefrontCatalogTokenService from '#services/storefront_catalog_token_service'
import {
  ensureCatalogOptions,
  sizeAndColorOptions,
  sizeOnlyOptions,
} from '#tests/helpers/catalog_options'
import { createTestProduct, ensureProductType, ensureVendor } from '#tests/helpers/collections'

let sequence = 0

/**
 * A GET to a token-protected storefront catalog route, from a fresh
 * session that already holds a catalog nonce and a matching token.
 */
export function catalogGet(client: ApiClient, url: string) {
  const nonce = randomBytes(16).toString('base64url')
  const { token } = new StorefrontCatalogTokenService().tokenFor(nonce)
  return client
    .get(url)
    .accept('json')
    .withSession({ [CATALOG_NONCE_SESSION_KEY]: nonce })
    .header(CATALOG_TOKEN_HEADER, token)
}

export async function createStorefrontCollection(status: CollectionStatus = 'active') {
  sequence++
  return Collection.create({
    title: `Filter collection ${sequence}`,
    slug: `filter-collection-${sequence}-${Date.now()}`,
    description: null,
    type: 'manual',
    match: 'all',
    sortOrder: 'manual',
    seoTitle: null,
    seoDescription: null,
    status,
    archivedAt: null,
  })
}

/** A product tracked at 0 stock on every variant (out of stock). */
async function markOutOfStock(product: Product) {
  await product.load('variants')
  for (const variant of product.variants) {
    await variant.merge({ trackInventory: true }).save()
  }
}

/**
 * An AUD primary market and a manual collection holding:
 * - Tee ($25, Acme, Shirts): Size S/M x Color Red/Blue, untracked except
 *   `M / Blue`, which is tracked with no stock.
 * - Hoodie ($60, Acme, Shirts): Size L.
 * - Mug ($10, Brewco, Kitchen): no options, out of stock.
 * - Lamp ($80, Lumen, Home): no options; its vendor is inactive.
 * - Draft ($5, Ghost, Hidden): draft, so never listed.
 */
export async function seedFilterCatalog() {
  const marketService = await app.container.make(MarketService)
  const productService = await app.container.make(ProductService)
  const collectionService = await app.container.make(CollectionService)

  await marketService.ensurePrimary({
    name: 'Australia',
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    countryCodes: ['AU'],
  })
  const catalog = await ensureCatalogOptions()
  const acme = await ensureVendor('Acme')
  const shirts = await ensureProductType('Shirts')

  const tee = await productService.create({
    title: 'Tee',
    description: null,
    status: 'active',
    price: 25,
    vendorId: acme.id,
    productTypeId: shirts.id,
    options: sizeAndColorOptions(catalog, ['S', 'M'], ['Red', 'Blue']),
  })
  const { product: teeDetail } = await productService.findDetail(tee.id)
  const mediumBlue = teeDetail.variants.find(({ title }) => title === 'M / Blue')!
  await mediumBlue.merge({ trackInventory: true }).save()

  const hoodie = await productService.create({
    title: 'Hoodie',
    description: null,
    status: 'active',
    price: 60,
    vendorId: acme.id,
    productTypeId: shirts.id,
    options: sizeOnlyOptions(catalog, ['L']),
  })

  const mug = await createTestProduct({
    title: 'Mug',
    price: 10,
    vendor: 'Brewco',
    productType: 'Kitchen',
  })
  await markOutOfStock(mug)

  const lamp = await createTestProduct({
    title: 'Lamp',
    price: 80,
    vendor: 'Lumen',
    productType: 'Home',
  })
  const lumen = await ensureVendor('Lumen')
  await lumen.merge({ isActive: false }).save()

  const draft = await createTestProduct({
    title: 'Draft',
    price: 5,
    vendor: 'Ghost',
    productType: 'Hidden',
    status: 'draft',
  })

  const collection = await createStorefrontCollection()
  await collectionService.addProducts(collection, [tee.id, hoodie.id, mug.id, lamp.id, draft.id])

  const brewco = await ensureVendor('Brewco')
  const kitchen = await ensureProductType('Kitchen')
  return { collection, acme, brewco, lumen, shirts, kitchen }
}

type FilterQuery = Record<string, string | number | boolean | string[]>

/** `?key=value&list[]=a&list[]=b`, the way the storefront sends filters. */
export function filterQuery(query: FilterQuery) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(`${key}[]`, item))
    else params.set(key, String(value))
  }
  const result = params.toString()
  return result ? `?${result}` : ''
}
