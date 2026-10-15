import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Product from '#models/product'
import ProductLabel from '#models/product_label'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import { createTestProduct } from '#tests/helpers/collections'

type Body = Record<string, unknown>

let sequence = 0

async function createLabel(overrides: Partial<{ name: string; isActive: boolean }> = {}) {
  sequence++
  return ProductLabel.create({
    name: overrides.name ?? `Label ${sequence}-${Date.now()}`,
    color: 'red',
    isActive: overrides.isActive ?? true,
  })
}

function send(client: any, method: 'post' | 'put', user: User, url: string, body: Body = {}) {
  return client[method](url)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

test.group('Staff product labels: CRUD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a label', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await send(client, 'post', user, '/admin/product-labels', {
      name: '  Hot  ',
      color: 'orange',
    })

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.name, 'Hot')
    assert.equal(data.color, 'orange')
    assert.isTrue(data.isActive)
    assert.equal(data.productsCount, 0)
  })

  test('rejects a duplicate name in any case and an unknown color', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createLabel({ name: 'Trending' })

    const response = await send(client, 'post', user, '/admin/product-labels', {
      name: 'trending',
      color: 'teal',
    })

    response.assertStatus(422)
    const fields = response.body().errors.map((error: { field: string }) => error.field)
    assert.includeMembers(fields, ['name', 'color'])
  })

  test('rejects a name longer than 40 characters', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await send(client, 'post', user, '/admin/product-labels', {
      name: 'x'.repeat(41),
      color: 'red',
    })

    response.assertStatus(422)
  })

  test('updates a label', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const label = await createLabel({ name: 'New' })

    const response = await send(client, 'put', user, `/admin/product-labels/${label.id}`, {
      name: 'Just in',
      color: 'green',
    })

    response.assertStatus(200)
    await label.refresh()
    assert.equal(label.name, 'Just in')
    assert.equal(label.color, 'green')
  })

  test('cannot edit an archived label', async ({ client }) => {
    const user = await createAdminUser('admin')
    const label = await createLabel({ isActive: false })

    const response = await send(client, 'put', user, `/admin/product-labels/${label.id}`, {
      name: 'Renamed',
      color: 'red',
    })

    response.assertStatus(422)
  })

  test('archives and restores a label', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const label = await createLabel()

    await send(client, 'post', user, `/admin/product-labels/${label.id}/archive`).then(
      (response: any) => response.assertStatus(200)
    )
    await label.refresh()
    assert.isFalse(label.isActive)

    const again = await send(client, 'post', user, `/admin/product-labels/${label.id}/archive`)
    again.assertStatus(422)

    await send(client, 'post', user, `/admin/product-labels/${label.id}/unarchive`).then(
      (response: any) => response.assertStatus(200)
    )
    await label.refresh()
    assert.isTrue(label.isActive)
  })

  test('lists labels with product counts, filtered by status', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const active = await createLabel({ name: 'Zz active label' })
    const archived = await createLabel({ name: 'Zz archived label', isActive: false })
    const product = await createTestProduct({ title: 'Labelled' })
    await product.merge({ productLabelId: active.id }).save()

    const response = await client
      .get('/admin/product-labels/list')
      .qs({ q: 'Zz', status: 'active' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const rows = response.body().data
    assert.deepEqual(
      rows.map((row: { id: string }) => row.id),
      [active.id]
    )
    assert.equal(rows[0].productsCount, 1)
    assert.notInclude(
      rows.map((row: { id: string }) => row.id),
      archived.id
    )
  })

  test('bulk archives and skips labels already archived', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const first = await createLabel()
    const second = await createLabel()
    const archived = await createLabel({ isActive: false })

    const response = await send(client, 'put', user, '/admin/product-labels/bulk/archive', {
      ids: [first.id, second.id, archived.id],
      archived: true,
    })

    response.assertStatus(200)
    assert.deepEqual(response.body().data, { updated: 2, skipped: 1 })
    const states = await ProductLabel.query().whereIn('id', [first.id, second.id])
    assert.isTrue(states.every((label) => !label.isActive))
  })
})

test.group('Staff product labels: permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('staff without product_labels.view get 403 on the list', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/product-labels/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('view-only staff cannot create, edit or archive', async ({ client }) => {
    const user = await createAdminUser(['product_labels.view'])
    const label = await createLabel()

    const store = await send(client, 'post', user, '/admin/product-labels', {
      name: 'Nope',
      color: 'red',
    })
    const update = await send(client, 'put', user, `/admin/product-labels/${label.id}`, {
      name: 'Nope',
      color: 'red',
    })
    const archive = await send(client, 'post', user, `/admin/product-labels/${label.id}/archive`)

    store.assertStatus(403)
    update.assertStatus(403)
    archive.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.get('/admin/product-labels/list').accept('json')

    response.assertStatus(401)
  })
})

test.group('Staff products: label field', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const details = (product: Product, productLabelId: string | null) => ({
    title: product.title,
    description: null,
    status: 'active',
    productLabelId,
  })

  test('sets and clears the label on a product', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const label = await createLabel({ name: 'Bestseller' })
    const product = await createTestProduct({ title: 'Candle' })

    const set = await send(
      client,
      'put',
      user,
      `/admin/products/${product.id}`,
      details(product, label.id)
    )
    set.assertStatus(200)
    assert.equal(set.body().data.productLabelId, label.id)
    assert.equal(set.body().data.productLabel.name, 'Bestseller')

    const cleared = await send(
      client,
      'put',
      user,
      `/admin/products/${product.id}`,
      details(product, null)
    )
    cleared.assertStatus(200)
    assert.isNull(cleared.body().data.productLabel)
  })

  test('rejects an archived label the product does not already use', async ({ client }) => {
    const user = await createAdminUser('admin')
    const label = await createLabel({ isActive: false })
    const product = await createTestProduct({ title: 'Candle' })

    const response = await send(
      client,
      'put',
      user,
      `/admin/products/${product.id}`,
      details(product, label.id)
    )

    response.assertStatus(422)
  })

  test('keeps an archived label the product already uses', async ({ client }) => {
    const user = await createAdminUser('admin')
    const label = await createLabel()
    const product = await createTestProduct({ title: 'Candle' })
    await product.merge({ productLabelId: label.id }).save()
    await label.merge({ isActive: false }).save()

    const response = await send(
      client,
      'put',
      user,
      `/admin/products/${product.id}`,
      details(product, label.id)
    )

    response.assertStatus(200)
  })

  test('the product form facets list only active labels', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const active = await createLabel()
    const archived = await createLabel({ isActive: false })

    const response = await client
      .get('/admin/products/facets')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const ids = response.body().data.productLabels.map((label: { id: string }) => label.id)
    assert.include(ids, active.id)
    assert.notInclude(ids, archived.id)
  })
})
