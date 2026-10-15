import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import type User from '#models/user'
import MarketService from '#services/market_service'
import { createAdminUser } from '#tests/helpers/admin'
import {
  ensureOptionDefinition,
  pickCatalogOptions,
  type CatalogOptionSelection,
} from '#tests/helpers/catalog_options'

async function tshirtPayload(): Promise<{
  title: string
  description: string
  status: 'active' | 'draft'
  price: number
  options: CatalogOptionSelection[]
}> {
  const size = await ensureOptionDefinition('Size', ['Small', 'Medium'])
  const color = await ensureOptionDefinition('Color', ['Black', 'White'])
  return {
    title: 'Classic T-Shirt',
    description: 'Soft cotton tee',
    status: 'active',
    price: 25,
    options: [
      pickCatalogOptions(size, ['Small', 'Medium']),
      pickCatalogOptions(color, ['Black', 'White']),
    ],
  }
}

test.group('Staff products: store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates the product with one variant per combination', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json(await tshirtPayload())
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.slug, 'classic-t-shirt')
    assert.equal(data.status, 'active')
    assert.deepEqual(
      data.variants.map((variant: { title: string }) => variant.title),
      ['Small / Black', 'Small / White', 'Medium / Black', 'Medium / White']
    )
    assert.equal(data.variants[0].price, 25)
    assert.deepEqual(data.variants[0].optionValues, [
      { optionName: 'Size', value: 'Small' },
      { optionName: 'Color', value: 'Black' },
    ])
    assert.lengthOf(data.options, 2)
  })

  test('creates a default variant when there are no options', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ ...(await tshirtPayload()), options: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    assert.deepEqual(
      response.body().data.variants.map((variant: { title: string }) => variant.title),
      ['Default Title']
    )
  })

  test('saves the original price on every variant and per market', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const marketService = await app.container.make(MarketService)
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

    const response = await client
      .post('/admin/products')
      .json({
        ...(await tshirtPayload()),
        price: 20,
        compareAtPrice: 30,
        marketPrices: [{ marketId: australia.id, price: 18, compareAtPrice: 27 }],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    const variants = response.body().data.variants
    assert.lengthOf(variants, 4)
    for (const variant of variants) {
      assert.equal(variant.price, 20)
      assert.equal(variant.compareAtPrice, 30)
      assert.deepEqual(variant.marketPrices, [
        { marketId: australia.id, price: 18, compareAtPrice: 27 },
      ])
    }
  })

  test('leaves the original price empty when it is omitted', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ ...(await tshirtPayload()), options: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    assert.isNull(response.body().data.variants[0].compareAtPrice)
  })

  test('rejects an original price that is not a number', async ({ client }) => {
    const user = await createAdminUser('admin')

    for (const compareAtPrice of ['30', -1, 12.345]) {
      const response = await client
        .post('/admin/products')
        .json({ ...(await tshirtPayload()), options: [], compareAtPrice })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'compareAtPrice' }] })
    }
  })

  test('charges tax by default', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ ...(await tshirtPayload()), options: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    assert.isTrue(response.body().data.chargeTax)
  })

  test('creates a product that does not charge tax', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ ...(await tshirtPayload()), options: [], chargeTax: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    assert.isFalse(response.body().data.chargeTax)
    const product = await Product.findOrFail(response.body().data.id)
    assert.isFalse(product.chargeTax)
  })

  test('rejects a non-boolean chargeTax', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ ...(await tshirtPayload()), options: [], chargeTax: 'sometimes' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'chargeTax' }] })
  })

  test('rejects missing fields', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ title: '', status: 'published', price: -1, options: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'title' },
        { field: 'description' },
        { field: 'status' },
        { field: 'price' },
      ],
    })
  })

  test('rejects the same catalog option twice', async ({ client }) => {
    const user = await createAdminUser('admin')
    const size = await ensureOptionDefinition('Size', ['S', 'M'])
    const row = pickCatalogOptions(size, ['S'])

    const response = await client
      .post('/admin/products')
      .json({
        ...(await tshirtPayload()),
        options: [row, { ...row, optionDefinitionValueIds: [size.values.M] }],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'options', rule: 'distinctDefinitions' }] })
  })

  test('rejects more than three options', async ({ client }) => {
    const user = await createAdminUser('admin')
    const option = async (name: string) => {
      const def = await ensureOptionDefinition(name, ['A'])
      return pickCatalogOptions(def, ['A'])
    }

    const response = await client
      .post('/admin/products')
      .json({
        ...(await tshirtPayload()),
        options: [await option('A'), await option('B'), await option('C'), await option('D')],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'options' }] })
  })

  test('rejects options that create more than 100 variants', async ({ client }) => {
    const user = await createAdminUser('admin')
    const labels = (prefix: string) => Array.from({ length: 11 }, (_, index) => `${prefix}${index}`)
    const a = await ensureOptionDefinition('VariantA', labels('a'))
    const b = await ensureOptionDefinition('VariantB', labels('b'))

    const response = await client
      .post('/admin/products')
      .json({
        ...(await tshirtPayload()),
        options: [pickCatalogOptions(a, labels('a')), pickCatalogOptions(b, labels('b'))],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'options', rule: 'maxVariants' }] })
  })

  test('requires the products.create permission', async ({ client, assert }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .post('/admin/products')
      .json(await tshirtPayload())
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
    assert.lengthOf(await Product.all(), 0)
  })
})

test.group('Staff products: list and view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createProduct(
    client: ApiClient,
    user: User,
    body?: Awaited<ReturnType<typeof tshirtPayload>>
  ) {
    const payload = body ?? (await tshirtPayload())
    const response = await client
      .post('/admin/products')
      .json(payload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    return response.body().data as { id: string }
  }

  test('guests are rejected', async ({ client }) => {
    const response = await client.get('/admin/products/list').accept('json')
    response.assertStatus(401)
  })

  test('requires the products.view permission', async ({ client }) => {
    const user = await createAdminUser(['dashboard.view'])

    const response = await client
      .get('/admin/products/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('lists products with variant counts and price range', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createProduct(client, user)

    const response = await client
      .get('/admin/products/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const [row] = response.body().data
    assert.equal(row.title, 'Classic T-Shirt')
    assert.equal(row.variantsCount, 4)
    assert.equal(row.availableTotal, 0)
    assert.equal(row.priceMin, 25)
    assert.equal(row.priceMax, 25)
    assert.equal(response.body().metadata.total, 1)
  })

  test('filters by status and searches by title', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createProduct(client, user)
    await createProduct(client, user, {
      ...(await tshirtPayload()),
      title: 'Draft Hoodie',
      status: 'draft',
    })

    const drafts = await client
      .get('/admin/products/list')
      .qs({ status: 'draft' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    const search = await client
      .get('/admin/products/list')
      .qs({ q: 'classic' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    assert.deepEqual(
      drafts.body().data.map((row: { title: string }) => row.title),
      ['Draft Hoodie']
    )
    assert.deepEqual(
      search.body().data.map((row: { title: string }) => row.title),
      ['Classic T-Shirt']
    )
  })

  test('rejects an unknown status filter', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get('/admin/products/list')
      .qs({ status: 'deleted' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns the product detail', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await createProduct(client, user)

    const response = await client
      .get(`/admin/products/view/${product.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.id, product.id)
    assert.lengthOf(data.variants, 4)
    assert.isArray(data.locations)
  })

  test('returns 404 for an unknown or malformed id', async ({ client }) => {
    const user = await createAdminUser('admin')

    const unknown = await client
      .get('/admin/products/view/01a11382-716f-7774-83b7-09aa5f030a10')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    const malformed = await client
      .get('/admin/products/view/not-a-uuid')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    unknown.assertStatus(404)
    malformed.assertStatus(404)
  })
})

test.group('Staff products: update, archive and unarchive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function seedProduct(status: 'draft' | 'active' | 'archived' = 'draft') {
    const product = await Product.create({
      title: 'Linen Shirt',
      slug: 'linen-shirt',
      description: null,
      status,
      archivedAt: null,
    })
    await ProductVariant.create({
      productId: product.id,
      title: 'Default Title',
      price: 60,
      trackInventory: false,
      position: 0,
    })
    return product
  }

  test('updates the details and regenerates the slug', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct()

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Linen Overshirt', description: 'Breathable', status: 'active' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: { title: 'Linen Overshirt', slug: 'linen-overshirt', status: 'active' },
    })
  })

  test('turns tax off and back on', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct()
    const update = (chargeTax: boolean) =>
      client
        .put(`/admin/products/${product.id}`)
        .json({ title: 'Linen Shirt', description: null, status: 'draft', chargeTax })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

    const off = await update(false)
    off.assertStatus(200)
    off.assertBodyContains({ data: { chargeTax: false } })
    await product.refresh()
    assert.isFalse(product.chargeTax)

    const on = await update(true)
    on.assertStatus(200)
    on.assertBodyContains({ data: { chargeTax: true } })
  })

  test('leaves chargeTax unchanged when it is omitted', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct()
    await product.merge({ chargeTax: false }).save()

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Linen Shirt', description: null, status: 'active' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    await product.refresh()
    assert.isFalse(product.chargeTax)
  })

  test('cannot set the archived status through update', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct()

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Linen Shirt', description: null, status: 'archived' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('refuses to edit an archived product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct('archived')

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Renamed', description: null, status: 'draft' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ message: 'Unarchive this product before editing it' }],
    })
  })

  test('requires the products.edit permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])
    const product = await seedProduct()

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Renamed', description: null, status: 'draft' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('archives and unarchives a product', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct('active')

    const archived = await client
      .post(`/admin/products/${product.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    archived.assertStatus(200)
    assert.equal(archived.body().data.status, 'archived')
    assert.isNotNull(archived.body().data.archivedAt)

    const again = await client
      .post(`/admin/products/${product.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    again.assertStatus(422)

    const restored = await client
      .post(`/admin/products/${product.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    restored.assertStatus(200)
    assert.equal(restored.body().data.status, 'active')
    assert.isNull(restored.body().data.archivedAt)
  })

  test('unarchive refuses a product that is not archived', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await seedProduct('active')

    const response = await client
      .post(`/admin/products/${product.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('archiving requires the products.archive permission', async ({ client }) => {
    const user = await createAdminUser(['products.view', 'products.edit'])
    const product = await seedProduct('active')

    const response = await client
      .post(`/admin/products/${product.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('bulk unarchive restores archived products as active', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const archived = await seedProduct('archived')
    const draft = await Product.create({
      title: 'Wool Scarf',
      slug: 'wool-scarf',
      description: null,
      status: 'draft',
      archivedAt: null,
    })

    const response = await client
      .put('/admin/products/bulk/archive')
      .json({ ids: [archived.id, draft.id], archived: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { updated: 1, skipped: 1 } })
    await Promise.all([archived.refresh(), draft.refresh()])
    assert.equal(archived.status, 'active')
    assert.isNull(archived.archivedAt)
    assert.equal(draft.status, 'draft')
  })

  test('bulk unarchive requires the products.archive permission', async ({ client, assert }) => {
    const user = await createAdminUser(['products.view', 'products.edit'])
    const product = await seedProduct('archived')

    const response = await client
      .put('/admin/products/bulk/archive')
      .json({ ids: [product.id], archived: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
    await product.refresh()
    assert.equal(product.status, 'archived')
  })
})
