import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors as lucidErrors } from '@adonisjs/lucid'
import ProductOption from '#models/product_option'
import ProductOptionValue from '#models/product_option_value'
import MarketRepository from '#repositories/market_repository'
import StorefrontCollectionService from '#services/storefront_collection_service'
import CollectionService from '#services/collection_service'
import { createTestProduct } from '#tests/helpers/collections'
import { createStorefrontCollection, seedFilterCatalog } from '#tests/helpers/storefront_catalog'

async function makeService() {
  return app.container.make(StorefrontCollectionService)
}

async function primaryMarket() {
  const repository = await app.container.make(MarketRepository)
  const market = await repository.findPrimaryWithCountries()
  return { id: market!.id, isPrimary: true }
}

test.group('StorefrontCollectionService.toFilters', () => {
  test('groups option entries by name, case-insensitively', async ({ assert }) => {
    const service = await makeService()

    const filters = service.toFilters({
      option: ['Size:M', 'size:L', 'Color:Red', 'SIZE:m'],
    })

    assert.deepEqual(filters.options, [
      { name: 'Size', values: ['M', 'L'] },
      { name: 'Color', values: ['Red'] },
    ])
  })

  test('splits on the first colon only', async ({ assert }) => {
    const service = await makeService()

    const filters = service.toFilters({ option: ['Ratio:16:9'] })

    assert.deepEqual(filters.options, [{ name: 'Ratio', values: ['16:9'] }])
  })

  test('skips entries without a name or value', async ({ assert }) => {
    const service = await makeService()

    const filters = service.toFilters({ option: [':M', 'Size:', 'Size: ', 'nothing'] })

    assert.deepEqual(filters.options, [])
  })

  test('swaps a reversed price range', async ({ assert }) => {
    const service = await makeService()

    const filters = service.toFilters({ priceMin: 50, priceMax: 10 })

    assert.equal(filters.priceMin, 10)
    assert.equal(filters.priceMax, 50)
  })

  test('passes ids and the stock flag through', async ({ assert }) => {
    const service = await makeService()

    const filters = service.toFilters({ vendor: ['a'], type: ['b'], inStock: true })

    assert.deepEqual(filters.vendorIds, ['a'])
    assert.deepEqual(filters.productTypeIds, ['b'])
    assert.isTrue(filters.inStock)
    assert.isUndefined(filters.priceMin)
    assert.isUndefined(filters.priceMax)
  })
})

test.group('StorefrontCollectionService.facets', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('merges option names and values that differ only in case', async ({ assert }) => {
    await seedFilterCatalog()
    const collectionService = await app.container.make(CollectionService)
    const collection = await createStorefrontCollection()
    const first = await createTestProduct({ title: 'Cap' })
    const second = await createTestProduct({ title: 'Beanie' })
    for (const [product, name, value] of [
      [first, 'Fit', 'Loose'],
      [second, 'fit', 'loose'],
    ] as const) {
      const option = await ProductOption.create({ productId: product.id, name, position: 0 })
      await ProductOptionValue.create({ productOptionId: option.id, value, position: 0 })
    }
    await collectionService.addProducts(collection, [first.id, second.id])

    const service = await makeService()
    const facets = await service.facets(collection.slug, await primaryMarket())

    assert.lengthOf(facets.options, 1)
    assert.equal(facets.options[0].name.toLowerCase(), 'fit')
    assert.lengthOf(facets.options[0].values, 1)
  })

  test('throws not found for a draft collection', async ({ assert }) => {
    await seedFilterCatalog()
    const draft = await createStorefrontCollection('draft')
    const service = await makeService()

    await assert.rejects(
      () => service.facets(draft.slug, { id: 'unused', isPrimary: true }),
      lucidErrors.E_ROW_NOT_FOUND
    )
  })
})

test.group('StorefrontCollectionService.paginateProducts with filters', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('applies the filters before paging', async ({ assert }) => {
    const { collection, acme } = await seedFilterCatalog()
    const service = await makeService()

    const { products, meta } = await service.paginateProducts(
      collection.slug,
      {
        page: 1,
        sort: 'title',
        direction: 'asc',
        filters: service.toFilters({ vendor: [acme.id], option: ['Size:L'] }),
      },
      await primaryMarket()
    )

    assert.deepEqual(
      products.map(({ title }) => title),
      ['Hoodie']
    )
    assert.equal(meta.total, 1)
  })
})
