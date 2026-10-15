import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import ProductReview from '#models/product_review'
import type User from '#models/user'
import ProductService from '#services/product_service'
import { createAdminUser } from '#tests/helpers/admin'
import { ensureCatalogOptions, sizeOnlyOptions } from '#tests/helpers/catalog_options'
import { createCustomerAccount } from '#tests/helpers/customers'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

type ActivityRow = {
  action: string
  auditableType: string
  auditableLabel: string | null
  actor: { kind: string; name: string }
  changes: { before: Record<string, unknown>; after: Record<string, unknown> | null }
}

async function seedProduct(title = 'Classic T-Shirt') {
  const catalog = await ensureCatalogOptions()
  const productService = await app.container.make(ProductService)
  const product = await productService.create({
    title,
    description: null,
    status: 'draft',
    price: 25,
    options: sizeOnlyOptions(catalog, ['S', 'M']),
  })
  const { product: detail } = await productService.findDetail(product.id)
  return { product, variants: detail.variants }
}

function as(client: ApiClient, user: User) {
  return {
    put: (url: string, body: Record<string, unknown>) =>
      client.put(url).json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user),
    delete: (url: string) =>
      client.delete(url).accept('json').withCsrfToken().withGuard('web').loginAs(user),
    get: (url: string) => client.get(url).accept('json').withGuard('web').loginAs(user),
  }
}

async function activity(client: ApiClient, user: User, productId: string, query = '') {
  const response = await as(client, user).get(`/admin/products/${productId}/activity${query}`)
  response.assertStatus(200)
  return response.body().data as ActivityRow[]
}

const actorName = (user: User) => user.fullName || user.email

test.group('Admin product activity', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('lists product updates with the staff member who made them', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedProduct()

    const update = await as(client, user).put(`/admin/products/${product.id}`, {
      title: 'Classic Tee',
      description: null,
      status: 'draft',
    })
    update.assertStatus(200)

    const rows = await activity(client, user, product.id)
    const row = rows.find((entry) => entry.auditableType === 'Product')!
    assert.equal(row.action, 'updated')
    assert.deepEqual(row.actor, { kind: 'staff', name: actorName(user) })
    assert.equal(row.changes.before.title, 'Classic T-Shirt')
    assert.equal(row.changes.after?.title, 'Classic Tee')
  })

  test('includes variant updates labelled with the variant title', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedProduct()

    const update = await as(client, user).put(
      `/admin/products/${product.id}/variants/${variants[0].id}`,
      { sku: 'CTS-S', barcode: null, price: 19, compareAtPrice: 25, trackInventory: false }
    )
    update.assertStatus(200)

    const rows = await activity(client, user, product.id)
    const row = rows.find((entry) => entry.auditableType === 'ProductVariant')!
    assert.equal(row.action, 'updated')
    assert.equal(row.auditableLabel, variants[0].title)
    assert.equal(row.actor.kind, 'staff')
    assert.equal(row.changes.after?.price, 19)
  })

  test('keeps the history of a deleted variant', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedProduct()

    const removed = await as(client, user).delete(
      `/admin/products/${product.id}/variants/${variants[1].id}`
    )
    removed.assertStatus(204)

    const rows = await activity(client, user, product.id)
    const row = rows.find(
      (entry) => entry.auditableType === 'ProductVariant' && entry.action === 'deleted'
    )!
    assert.equal(row.auditableLabel, variants[1].title)
    assert.equal(row.changes.before.productId, product.id)
  })

  test('creating a product through the back office logs a created entry', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')

    const created = await client
      .post('/admin/products')
      .json({ title: 'Linen Shirt', description: null, status: 'draft', price: 60, options: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    created.assertStatus(201)

    const rows = await activity(client, user, created.body().data.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].action, 'created')
    assert.equal(rows[0].auditableLabel, 'Linen Shirt')
    assert.deepEqual(rows[0].actor, { kind: 'staff', name: actorName(user) })
  })

  test('excludes changes to other products and their variants', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedProduct('Shirt A')
    const other = await seedProduct('Shirt B')

    await as(client, user)
      .put(`/admin/products/${other.product.id}`, {
        title: 'Shirt B2',
        description: null,
        status: 'draft',
      })
      .then((response) => response.assertStatus(200))
    await as(client, user)
      .delete(`/admin/products/${other.product.id}/variants/${other.variants[1].id}`)
      .then((response) => response.assertStatus(204))

    assert.deepEqual(await activity(client, user, product.id), [])
  })

  test('filters by action', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedProduct()
    await as(client, user)
      .put(`/admin/products/${product.id}`, { title: 'Tee', description: null, status: 'draft' })
      .then((response) => response.assertStatus(200))
    await as(client, user)
      .delete(`/admin/products/${product.id}/variants/${variants[1].id}`)
      .then((response) => response.assertStatus(204))

    const deleted = await activity(client, user, product.id, '?action=deleted')
    assert.deepEqual(
      deleted.map(({ action }) => action),
      ['deleted']
    )
  })

  test('rejects an unknown action filter', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedProduct()

    const response = await as(client, user).get(
      `/admin/products/${product.id}/activity?action=exploded`
    )

    response.assertStatus(422)
  })

  test('returns 404 for an unknown product', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await as(client, user).get(`/admin/products/${UNKNOWN_ID}/activity`)

    response.assertStatus(404)
  })

  test('requires the products.view permission', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    const { product } = await seedProduct()

    const response = await as(client, user).get(`/admin/products/${product.id}/activity`)

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const { product } = await seedProduct()

    const response = await client.get(`/admin/products/${product.id}/activity`).accept('json')

    response.assertStatus(401)
  })
})

test.group('Admin product detail: reviews count', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('counts every review, including hidden ones', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedProduct()
    const first = await createCustomerAccount()
    const second = await createCustomerAccount()
    await ProductReview.createMany([
      {
        productId: product.id,
        customerId: first.customer.id,
        rating: 5,
        title: 'Great',
        body: 'Soft and fits well.',
        isHidden: false,
        isFeatured: false,
      },
      {
        productId: product.id,
        customerId: second.customer.id,
        rating: 1,
        title: null,
        body: 'Not for me.',
        isHidden: true,
        isFeatured: false,
      },
    ])

    const response = await as(client, user).get(`/admin/products/view/${product.id}`)

    response.assertStatus(200)
    assert.equal(response.body().data.reviewsCount, 2)
  })

  test('is zero for a product without reviews', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedProduct()

    const response = await as(client, user).get(`/admin/products/view/${product.id}`)

    response.assertStatus(200)
    assert.equal(response.body().data.reviewsCount, 0)
  })
})
