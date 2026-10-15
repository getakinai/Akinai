import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type { Permission } from '#abilities/permissions'
import Collection from '#models/collection'
import CollectionProduct from '#models/collection_product'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import {
  createTestProduct,
  createTestProducts,
  ensureProductType,
  ensureVendor,
} from '#tests/helpers/collections'

type RuleInput = { field: string; operator: string; value: string | null }

function automatedPayload(rules: RuleInput[], extra: Record<string, unknown> = {}) {
  return {
    type: 'automated',
    title: 'On Sale',
    description: null,
    status: 'active',
    rules,
    ...extra,
  }
}

function manualPayload(extra: Record<string, unknown> = {}) {
  return { type: 'manual', title: 'Gift Bundles', description: null, status: 'draft', ...extra }
}

async function createCollection(client: ApiClient, user: User, payload: Record<string, unknown>) {
  const response = await client
    .post('/admin/collections')
    .json(payload)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
  response.assertStatus(201)
  return response.body().data as { id: string; slug: string }
}

async function productTitles(client: ApiClient, user: User, collectionId: string) {
  const response = await client
    .get(`/admin/collections/${collectionId}/products/list`)
    .accept('json')
    .withGuard('web')
    .loginAs(user)
  response.assertStatus(200)
  return response.body().data.map((product: { title: string }) => product.title)
}

async function previewTitles(
  client: ApiClient,
  user: User,
  rules: RuleInput[],
  { match = 'all', sortOrder = 'title_asc' }: { match?: string; sortOrder?: string } = {}
) {
  const response = await client
    .post('/admin/collections/preview')
    .json({ match, sortOrder, rules })
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
  response.assertStatus(200)
  return response.body().data.map((product: { title: string }) => product.title)
}

async function staff(permissions: Permission[]) {
  return createAdminUser(permissions)
}

test.group('Staff collections: store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates an automated collection with best selling as the default sort', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Sale Box', price: 500, compareAtPrice: 700 })
    await createTestProduct({ title: 'Full Price Box', price: 500 })

    const response = await client
      .post('/admin/collections')
      .json(
        automatedPayload([{ field: 'compare_at_price', operator: 'is_set', value: null }], {
          seoTitle: 'Sale | Gifts',
          seoDescription: 'Discounted gifts',
        })
      )
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.slug, 'on-sale')
    assert.equal(data.type, 'automated')
    assert.equal(data.match, 'all')
    assert.equal(data.sortOrder, 'best_selling')
    assert.equal(data.seoTitle, 'Sale | Gifts')
    assert.equal(data.productsCount, 1)
    assert.deepEqual(data.rules, [
      {
        id: data.rules[0].id,
        field: 'compare_at_price',
        operator: 'is_set',
        value: null,
        position: 0,
      },
    ])
  })

  test('creates a manual collection with a custom URL handle', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const data = await createCollection(client, user, manualPayload({ slug: 'Holiday Picks!' }))

    const collection = await Collection.findOrFail(data.id)
    assert.equal(collection.slug, 'holiday-picks')
    assert.equal(collection.sortOrder, 'manual')
  })

  test('returns 422 for invalid conditions', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/collections')
      .json(
        automatedPayload([
          { field: 'tag', operator: 'greater_than', value: 'new' },
          { field: 'variant_price', operator: 'less_than', value: 'cheap' },
        ])
      )
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'rules.0.operator' }, { field: 'rules.1.value' }],
    })
  })

  test('returns 422 when an automated collection has no conditions', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/collections')
      .json(automatedPayload([]))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'rules' }] })
  })

  test('returns 422 when a manual collection has conditions', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/collections')
      .json(manualPayload({ rules: [{ field: 'tag', operator: 'equals', value: 'new' }] }))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'rules' }] })
  })

  test('returns 422 when an automated collection is sorted by hand', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/collections')
      .json(
        automatedPayload([{ field: 'tag', operator: 'equals', value: 'new' }], {
          sortOrder: 'manual',
        })
      )
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'sortOrder' }] })
  })

  test('returns 422 for a URL handle already in use', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createCollection(client, user, manualPayload({ slug: 'picks' }))

    const response = await client
      .post('/admin/collections')
      .json(manualPayload({ title: 'Other', slug: 'picks' }))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'slug' }] })
  })

  test('returns 422 for missing required fields', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/collections')
      .json({ type: 'smart', title: '', status: 'published' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 403 without collections.create', async ({ client }) => {
    const user = await staff(['collections.view'])

    const response = await client
      .post('/admin/collections')
      .json(manualPayload())
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff collections: list and view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists collections with product counts and filters by type', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Tagged', tags: ['new'] })
    await createCollection(
      client,
      user,
      automatedPayload([{ field: 'tag', operator: 'equals', value: 'new' }], { title: 'New' })
    )
    await createCollection(client, user, manualPayload())

    const all = await client
      .get('/admin/collections/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    const automated = await client
      .get('/admin/collections/list?type=automated')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    all.assertStatus(200)
    assert.equal(all.body().metadata.total, 2)
    automated.assertStatus(200)
    assert.lengthOf(automated.body().data, 1)
    assert.equal(automated.body().data[0].title, 'New')
    assert.equal(automated.body().data[0].productsCount, 1)
  })

  test('searches collections by title', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createCollection(client, user, manualPayload({ title: 'Holiday Picks' }))
    await createCollection(client, user, manualPayload({ title: 'Snacks' }))

    const response = await client
      .get('/admin/collections/list?q=holi')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((row: { title: string }) => row.title),
      ['Holiday Picks']
    )
  })

  test('returns 422 for an invalid list query', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get('/admin/collections/list?type=smart&perPage=7')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('views a collection with its rules', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const created = await createCollection(
      client,
      user,
      automatedPayload([
        { field: 'tag', operator: 'equals', value: 'new' },
        { field: 'vendor', operator: 'not_equals', value: 'Acme' },
      ])
    )

    const response = await client
      .get(`/admin/collections/view/${created.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.rules.map((rule: RuleInput) => rule.field),
      ['tag', 'vendor']
    )
  })

  test('returns 404 for an unknown collection', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get('/admin/collections/view/019a0000-0000-7000-8000-000000000000')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('returns 403 without collections.view', async ({ client }) => {
    const user = await staff(['products.view'])

    const response = await client
      .get('/admin/collections/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff collections: rule matching', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('matches tags case-insensitively and skips archived products', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Alpha', tags: ['new'] })
    await createTestProduct({ title: 'Beta', tags: ['new'], status: 'archived' })
    await createTestProduct({ title: 'Gamma', tags: ['sale'] })

    assert.deepEqual(
      await previewTitles(client, user, [{ field: 'tag', operator: 'equals', value: 'NEW' }]),
      ['Alpha']
    )
  })

  test('excludes products with negative conditions', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Alpha', compareAtPrice: 200 })
    await createTestProduct({ title: 'Beta', compareAtPrice: 200, tags: ['exclude-from-sale'] })
    await createTestProduct({ title: 'Gamma' })

    assert.deepEqual(
      await previewTitles(client, user, [
        { field: 'compare_at_price', operator: 'is_set', value: null },
        { field: 'tag', operator: 'not_equals', value: 'exclude-from-sale' },
      ]),
      ['Alpha']
    )
  })

  test('negative text conditions include products with an empty field', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Alpha', vendor: 'Acme' })
    await createTestProduct({ title: 'Beta', vendor: null })
    await createTestProduct({ title: 'Gamma', vendor: 'Other' })

    assert.deepEqual(
      await previewTitles(client, user, [
        { field: 'vendor', operator: 'not_equals', value: 'acme' },
      ]),
      ['Beta', 'Gamma']
    )
  })

  test('matches any condition when match is any', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Alpha Box' })
    await createTestProduct({ title: 'Beta Bag' })
    await createTestProduct({ title: 'Gamma Box' })

    assert.deepEqual(
      await previewTitles(
        client,
        user,
        [
          { field: 'title', operator: 'starts_with', value: 'alpha' },
          { field: 'title', operator: 'ends_with', value: 'bag' },
        ],
        { match: 'any' }
      ),
      ['Alpha Box', 'Beta Bag']
    )
  })

  test('treats LIKE wildcards in values literally', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: '100% Cotton' })
    await createTestProduct({ title: '1000 Cotton' })

    assert.deepEqual(
      await previewTitles(client, user, [{ field: 'title', operator: 'contains', value: '100%' }]),
      ['100% Cotton']
    )
  })

  test('matches price and product type and sorts by price', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Big', price: 1500, productType: 'Gift box' })
    await createTestProduct({ title: 'Small', price: 300, productType: 'Gift box' })
    await createTestProduct({ title: 'Mid', price: 800, productType: 'Gift box' })
    await createTestProduct({ title: 'Snack', price: 100, productType: 'Snacks' })

    assert.deepEqual(
      await previewTitles(
        client,
        user,
        [
          { field: 'variant_price', operator: 'less_than', value: '1000' },
          { field: 'product_type', operator: 'equals', value: 'gift box' },
        ],
        { sortOrder: 'price_asc' }
      ),
      ['Small', 'Mid']
    )
    assert.deepEqual(
      await previewTitles(
        client,
        user,
        [{ field: 'product_type', operator: 'contains', value: 'gift' }],
        { sortOrder: 'price_desc' }
      ),
      ['Big', 'Mid', 'Small']
    )
  })

  test('returns 422 for invalid preview conditions', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/collections/preview')
      .json({
        match: 'all',
        sortOrder: 'title_asc',
        rules: [{ field: 'tag', operator: 'equals', value: '' }],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'rules.0.value' }] })
  })
})

test.group('Staff collections: manual products', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('adds products in order and skips duplicates', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const [alpha, beta] = await createTestProducts(['Alpha', 'Beta'])
    const collection = await createCollection(client, user, manualPayload())

    const response = await client
      .post(`/admin/collections/${collection.id}/products`)
      .json({ productIds: [beta.id, alpha.id, beta.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().data.added, 2)
    assert.deepEqual(await productTitles(client, user, collection.id), ['Beta', 'Alpha'])
  })

  test('moves a product to a new position', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const products = await createTestProducts(['Alpha', 'Beta', 'Gamma'])
    const collection = await createCollection(client, user, manualPayload())
    await CollectionProduct.createMany(
      products.map((product, position) => ({
        collectionId: collection.id,
        productId: product.id,
        position,
      }))
    )

    const response = await client
      .put(`/admin/collections/${collection.id}/products/reorder`)
      .json({ productId: products[2].id, position: 0 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    assert.deepEqual(await productTitles(client, user, collection.id), ['Gamma', 'Alpha', 'Beta'])
  })

  test('removes a product and returns 404 when it is not in the collection', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')
    const [alpha, beta] = await createTestProducts(['Alpha', 'Beta'])
    const collection = await createCollection(client, user, manualPayload())
    await CollectionProduct.createMany([
      { collectionId: collection.id, productId: alpha.id, position: 0 },
      { collectionId: collection.id, productId: beta.id, position: 1 },
    ])

    const removed = await client
      .delete(`/admin/collections/${collection.id}/products/${alpha.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    const again = await client
      .delete(`/admin/collections/${collection.id}/products/${alpha.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    removed.assertStatus(204)
    again.assertStatus(404)
    assert.deepEqual(await productTitles(client, user, collection.id), ['Beta'])
  })

  test('returns 422 when adding products to an automated collection', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Alpha' })
    const collection = await createCollection(
      client,
      user,
      automatedPayload([{ field: 'tag', operator: 'equals', value: 'new' }])
    )

    const response = await client
      .post(`/admin/collections/${collection.id}/products`)
      .json({ productIds: [product.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 422 when reordering a collection not sorted by hand', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Alpha' })
    const collection = await createCollection(
      client,
      user,
      manualPayload({ sortOrder: 'title_asc' })
    )
    await CollectionProduct.create({
      collectionId: collection.id,
      productId: product.id,
      position: 0,
    })

    const response = await client
      .put(`/admin/collections/${collection.id}/products/reorder`)
      .json({ productId: product.id, position: 0 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 422 for an invalid product list', async ({ client }) => {
    const user = await createAdminUser('admin')
    const collection = await createCollection(client, user, manualPayload())

    const response = await client
      .post(`/admin/collections/${collection.id}/products`)
      .json({ productIds: ['not-a-uuid'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 403 without collections.edit', async ({ client }) => {
    const admin = await createAdminUser('admin')
    const user = await staff(['collections.view'])
    const product = await createTestProduct({ title: 'Alpha' })
    const collection = await createCollection(client, admin, manualPayload())

    const response = await client
      .post(`/admin/collections/${collection.id}/products`)
      .json({ productIds: [product.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff collections: update and archive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('updates fields and replaces conditions without changing the type or slug', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')
    await createTestProduct({ title: 'Alpha', tags: ['new'] })
    await createTestProduct({ title: 'Beta', tags: ['sale'] })
    const collection = await createCollection(
      client,
      user,
      automatedPayload([{ field: 'tag', operator: 'equals', value: 'new' }])
    )

    const response = await client
      .put(`/admin/collections/${collection.id}`)
      .json({
        type: 'manual',
        title: 'Weekly Sale',
        description: '<p>Deals</p>',
        status: 'active',
        match: 'any',
        sortOrder: 'title_desc',
        rules: [
          { field: 'tag', operator: 'equals', value: 'new' },
          { field: 'tag', operator: 'equals', value: 'sale' },
        ],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.title, 'Weekly Sale')
    assert.equal(data.slug, 'on-sale')
    assert.equal(data.type, 'automated')
    assert.equal(data.match, 'any')
    assert.lengthOf(data.rules, 2)
    assert.equal(data.productsCount, 2)
    assert.deepEqual(await productTitles(client, user, collection.id), ['Beta', 'Alpha'])
  })

  test('keeps the conditions when the update omits them', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const collection = await createCollection(
      client,
      user,
      automatedPayload([{ field: 'tag', operator: 'equals', value: 'new' }])
    )

    const response = await client
      .put(`/admin/collections/${collection.id}`)
      .json({ title: 'Renamed', description: null, status: 'draft' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.lengthOf(response.body().data.rules, 1)
  })

  test('archives and unarchives a collection as a draft', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const collection = await createCollection(client, user, manualPayload({ status: 'active' }))

    const archived = await client
      .post(`/admin/collections/${collection.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    const archivedAgain = await client
      .post(`/admin/collections/${collection.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    const restored = await client
      .post(`/admin/collections/${collection.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    archived.assertStatus(200)
    assert.equal(archived.body().data.status, 'archived')
    assert.isNotNull(archived.body().data.archivedAt)
    archivedAgain.assertStatus(422)
    restored.assertStatus(200)
    assert.equal(restored.body().data.status, 'draft')
    assert.isNull(restored.body().data.archivedAt)
  })

  test('returns 422 when updating an archived collection', async ({ client }) => {
    const user = await createAdminUser('admin')
    const collection = await createCollection(client, user, manualPayload())
    await Collection.query().where('id', collection.id).update({ status: 'archived' })

    const response = await client
      .put(`/admin/collections/${collection.id}`)
      .json({ title: 'Renamed', description: null, status: 'active' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 403 without collections.archive', async ({ client }) => {
    const admin = await createAdminUser('admin')
    const user = await staff(['collections.view', 'collections.edit'])
    const collection = await createCollection(client, admin, manualPayload())

    const response = await client
      .post(`/admin/collections/${collection.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff products: merchandising fields', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('stores product type, vendor and normalized tags', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const giftBox = await ensureProductType('Gift box')
    const acme = await ensureVendor('Acme')

    const response = await client
      .post('/admin/products')
      .json({
        title: 'Pasalubong Box',
        description: null,
        status: 'active',
        price: 500,
        options: [],
        productTypeId: giftBox.id,
        vendorId: acme.id,
        tags: [' New ', 'SALE', 'new'],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.productTypeId, giftBox.id)
    assert.deepEqual(data.productType, { id: giftBox.id, name: 'Gift box', isActive: true })
    assert.deepEqual(data.vendor, { id: acme.id, name: 'Acme', isActive: true })
    assert.deepEqual(data.tags, ['new', 'sale'])
  })

  test('leaves omitted fields unchanged and replaces tags when given', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Box', vendor: 'Acme', tags: ['new'] })

    const kept = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Box', description: null, status: 'active' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    const replaced = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Box', description: null, status: 'active', vendorId: null, tags: ['sale'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    kept.assertStatus(200)
    assert.equal(kept.body().data.vendor.name, 'Acme')
    assert.deepEqual(kept.body().data.tags, ['new'])
    replaced.assertStatus(200)
    assert.isNull(replaced.body().data.vendor)
    assert.deepEqual(replaced.body().data.tags, ['sale'])
  })

  test('rejects archived or unknown product types and vendors', async ({ client }) => {
    const user = await createAdminUser('admin')
    const archived = await ensureProductType('Retired', false)

    const response = await client
      .post('/admin/products')
      .json({
        title: 'Box',
        description: null,
        status: 'draft',
        price: 100,
        options: [],
        productTypeId: archived.id,
        vendorId: '019a0000-0000-7000-8000-000000000000',
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'productTypeId' }, { field: 'vendorId' }],
    })
  })

  test('keeps an archived product type the product already uses', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Box', productType: 'Retired' })
    const retired = await ensureProductType('Retired')
    await retired.merge({ isActive: false }).save()

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Box', description: null, status: 'active', productTypeId: retired.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(response.body().data.productType, {
      id: retired.id,
      name: 'Retired',
      isActive: false,
    })
  })

  test('returns 422 for a tag longer than 40 characters', async ({ client }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Box' })

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Box', description: null, status: 'active', tags: ['x'.repeat(41)] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns active product types, vendors and tags in use', async ({ client, assert }) => {
    const user = await createAdminUser(['products.view'])
    await createTestProduct({ title: 'A', productType: 'Gift box', vendor: 'Acme', tags: ['new'] })
    await createTestProduct({ title: 'B', productType: 'Gift box', tags: ['new', 'sale'] })
    await ensureProductType('Retired', false)
    const snacks = await ensureProductType('Snacks')

    const response = await client
      .get('/admin/products/facets')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.deepEqual(
      data.productTypes.map(({ name }: { name: string }) => name),
      ['Gift box', 'Snacks']
    )
    assert.deepInclude(data.productTypes, { id: snacks.id, name: 'Snacks' })
    assert.deepEqual(
      data.vendors.map(({ name }: { name: string }) => name),
      ['Acme']
    )
    assert.deepEqual(data.tags, ['new', 'sale'])
  })
})
