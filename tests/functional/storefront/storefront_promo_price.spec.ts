import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { MARKET_COOKIE } from '#constants/market'
import type Market from '#models/market'
import CollectionService from '#services/collection_service'
import MarketService from '#services/market_service'
import ProductService from '#services/product_service'
import { catalogGet, createStorefrontCollection } from '#tests/helpers/storefront_catalog'

async function seedPromo() {
  const marketService = await app.container.make(MarketService)
  const productService = await app.container.make(ProductService)
  const collectionService = await app.container.make(CollectionService)

  await marketService.ensurePrimary({
    name: 'New Zealand',
    currencyCode: 'NZD',
    pricesIncludeTax: true,
    countryCodes: ['NZ'],
  })
  const australia = await marketService.create({
    name: 'Australia',
    currencyCode: 'AUD',
    pricesIncludeTax: false,
    countryCodes: ['AU'],
  })

  const onSale = await productService.create({
    title: 'Promo Tee',
    description: null,
    status: 'active',
    price: 20,
    compareAtPrice: 30,
    marketPrices: [{ marketId: australia.id, price: 18, compareAtPrice: 27 }],
    options: [],
  })
  const notCheaper = await productService.create({
    title: 'Odd Mug',
    description: null,
    status: 'active',
    price: 15,
    compareAtPrice: 10,
    options: [],
  })

  const collection = await createStorefrontCollection()
  await collectionService.addProducts(collection, [onSale.id, notCheaper.id])
  return { australia, collection, onSale, notCheaper }
}

/**
 * The market cookie is set raw by the browser (`encode: false`), so it goes
 * in the cookie jar as is. A manual `Cookie` header would be replaced by
 * the session cookie the test client adds to every request.
 */
function inMarket(client: ApiClient, url: string, market?: Market) {
  const request = catalogGet(client, url)
  if (market) request.cookiesJar[MARKET_COOKIE] = { name: MARKET_COOKIE, value: market.handle }
  return request
}

test.group('Storefront promo prices', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    return testUtils.db().withGlobalTransaction()
  })
  group.each.timeout(20_000)

  test('product cards return the original price in each market', async ({ client, assert }) => {
    const { australia, collection } = await seedPromo()
    const url = `/store/collections/${collection.slug}/products?sort=title`

    const primary = await inMarket(client, url)
    primary.assertStatus(200)
    const primaryCards = primary.body().data
    assert.deepEqual(
      primaryCards.map(({ title, price, compareAtPrice }: Record<string, unknown>) => ({
        title,
        price,
        compareAtPrice,
      })),
      [
        { title: 'Odd Mug', price: 15, compareAtPrice: null },
        { title: 'Promo Tee', price: 20, compareAtPrice: 30 },
      ]
    )

    const local = await inMarket(client, url, australia)
    local.assertStatus(200)
    const tee = local.body().data.find(({ title }: { title: string }) => title === 'Promo Tee')
    assert.equal(tee.price, 18)
    assert.equal(tee.compareAtPrice, 27)
  })

  test('the product page returns the original price in each market', async ({ client, assert }) => {
    const { australia, onSale, notCheaper } = await seedPromo()

    const primary = await inMarket(client, `/store/products/view/${onSale.slug}`)
    primary.assertStatus(200)
    assert.equal(primary.body().data.variants[0].price, 20)
    assert.equal(primary.body().data.variants[0].compareAtPrice, 30)

    const local = await inMarket(client, `/store/products/view/${onSale.slug}`, australia)
    local.assertStatus(200)
    assert.equal(local.body().data.variants[0].price, 18)
    assert.equal(local.body().data.variants[0].compareAtPrice, 27)

    const mug = await inMarket(client, `/store/products/view/${notCheaper.slug}`)
    mug.assertStatus(200)
    assert.isNull(mug.body().data.variants[0].compareAtPrice)
  })
})
