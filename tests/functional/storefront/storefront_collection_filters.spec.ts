import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  catalogGet,
  createStorefrontCollection,
  filterQuery,
  seedFilterCatalog,
} from '#tests/helpers/storefront_catalog'

type Query = Parameters<typeof filterQuery>[0]

const productsUrl = (slug: string, query: Query = {}) =>
  `/store/collections/${slug}/products${filterQuery(query)}`

async function titles(client: ApiClient, slug: string, query: Query = {}) {
  const response = await catalogGet(client, productsUrl(slug, { sort: 'title', ...query }))
  response.assertStatus(200)
  return (response.body().data as { title: string }[]).map(({ title }) => title)
}

test.group('Storefront collection filters: facets', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    return testUtils.db().withGlobalTransaction()
  })
  group.each.timeout(20_000)

  test('lists price range, active vendors and types, and option values', async ({
    client,
    assert,
  }) => {
    const { collection, acme, brewco, shirts, kitchen } = await seedFilterCatalog()

    const response = await catalogGet(client, `/store/collections/${collection.slug}/filters`)

    response.assertStatus(200)
    const data = response.body().data
    assert.deepEqual(data.price, { min: 10, max: 80 })
    assert.deepEqual(data.vendors, [
      { id: acme.id, name: 'Acme', count: 2 },
      { id: brewco.id, name: 'Brewco', count: 1 },
    ])
    assert.deepEqual(
      data.productTypes.map(({ name, count }: { name: string; count: number }) => [name, count]),
      [
        ['Home', 1],
        ['Kitchen', 1],
        ['Shirts', 2],
      ]
    )
    assert.includeMembers(
      data.productTypes.map(({ id }: { id: string }) => id),
      [shirts.id, kitchen.id]
    )
    const size = data.options.find(({ name }: { name: string }) => name === 'Size')
    const color = data.options.find(({ name }: { name: string }) => name === 'Color')
    assert.sameMembers(size.values, ['S', 'M', 'L'])
    assert.sameMembers(color.values, ['Red', 'Blue'])
  })

  test('leaves out draft products and inactive vendors', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    const response = await catalogGet(client, `/store/collections/${collection.slug}/filters`)

    const data = response.body().data
    const vendorNames = data.vendors.map(({ name }: { name: string }) => name)
    assert.notInclude(vendorNames, 'Ghost')
    assert.notInclude(vendorNames, 'Lumen')
    assert.notInclude(
      data.productTypes.map(({ name }: { name: string }) => name),
      'Hidden'
    )
  })

  test('returns empty facets for a collection without products', async ({ client, assert }) => {
    await seedFilterCatalog()
    const empty = await createStorefrontCollection()

    const response = await catalogGet(client, `/store/collections/${empty.slug}/filters`)

    response.assertStatus(200)
    assert.deepEqual(response.body().data, {
      price: { min: null, max: null },
      vendors: [],
      productTypes: [],
      options: [],
    })
  })

  test('returns 404 for an unknown or draft collection', async ({ client }) => {
    await seedFilterCatalog()
    const draft = await createStorefrontCollection('draft')

    const unknown = await catalogGet(client, '/store/collections/no-such-thing/filters')
    const hidden = await catalogGet(client, `/store/collections/${draft.slug}/filters`)

    unknown.assertStatus(404)
    hidden.assertStatus(404)
  })
})

test.group('Storefront collection filters: products list', (group) => {
  group.each.setup(async () => {
    await limiter.clear(['memory'])
    return testUtils.db().withGlobalTransaction()
  })
  group.each.timeout(20_000)

  test('lists every active product without filters', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug), ['Hoodie', 'Lamp', 'Mug', 'Tee'])
  })

  test('filters by price range overlap', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { priceMin: 20, priceMax: 60 }), [
      'Hoodie',
      'Tee',
    ])
    assert.deepEqual(await titles(client, collection.slug, { priceMin: 70 }), ['Lamp'])
    assert.deepEqual(await titles(client, collection.slug, { priceMax: 10 }), ['Mug'])
  })

  test('puts a swapped price range back in order', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { priceMin: 60, priceMax: 20 }), [
      'Hoodie',
      'Tee',
    ])
  })

  test('matches any of the selected vendors', async ({ client, assert }) => {
    const { collection, acme, brewco } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { vendor: [acme.id] }), [
      'Hoodie',
      'Tee',
    ])
    assert.deepEqual(await titles(client, collection.slug, { vendor: [acme.id, brewco.id] }), [
      'Hoodie',
      'Mug',
      'Tee',
    ])
  })

  test('matches any of the selected product types', async ({ client, assert }) => {
    const { collection, kitchen } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { type: [kitchen.id] }), ['Mug'])
  })

  test('matches any value of one option', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { option: ['Size:M'] }), ['Tee'])
    assert.deepEqual(await titles(client, collection.slug, { option: ['Size:M', 'Size:L'] }), [
      'Hoodie',
      'Tee',
    ])
  })

  test('requires every selected option on the same variant', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { option: ['Size:L', 'Color:Red'] }), [])
    assert.deepEqual(await titles(client, collection.slug, { option: ['Size:S', 'Color:Blue'] }), [
      'Tee',
    ])
  })

  test('matches option names and values case-insensitively', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { option: ['size:l'] }), ['Hoodie'])
  })

  test('keeps only products with an in-stock variant', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { inStock: true }), [
      'Hoodie',
      'Lamp',
      'Tee',
    ])
  })

  test('checks stock on the variant that matches the options', async ({ client, assert }) => {
    const { collection } = await seedFilterCatalog()

    assert.deepEqual(await titles(client, collection.slug, { option: ['Size:M', 'Color:Blue'] }), [
      'Tee',
    ])
    assert.deepEqual(
      await titles(client, collection.slug, {
        option: ['Size:M', 'Color:Blue'],
        inStock: true,
      }),
      []
    )
  })

  test('combines filters with sorting and reports the filtered total', async ({
    client,
    assert,
  }) => {
    const { collection, acme, brewco } = await seedFilterCatalog()

    const response = await catalogGet(
      client,
      productsUrl(collection.slug, {
        sort: 'price',
        direction: 'desc',
        vendor: [acme.id, brewco.id],
        inStock: true,
      })
    )

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map(({ title }: { title: string }) => title),
      ['Hoodie', 'Tee']
    )
    assert.equal(response.body().metadata.total, 2)
  })

  test('rejects invalid filter values', async ({ client }) => {
    const { collection } = await seedFilterCatalog()
    const invalid: Query[] = [
      { vendor: ['not-a-uuid'] },
      { type: ['not-a-uuid'] },
      { priceMin: -1 },
      { priceMax: 'cheap' },
      { option: ['no-separator'] },
      { option: [':M'] },
      { inStock: 'maybe' },
      { vendor: Array.from({ length: 31 }, () => '01a11382-716f-7774-83b7-09aa5f030a10') },
    ]

    for (const query of invalid) {
      const response = await catalogGet(client, productsUrl(collection.slug, query))
      response.assertStatus(422)
    }
  })

  test('returns 404 for an unknown collection', async ({ client }) => {
    await seedFilterCatalog()

    const response = await catalogGet(client, productsUrl('no-such-thing', { option: ['Size:M'] }))

    response.assertStatus(404)
  })
})
