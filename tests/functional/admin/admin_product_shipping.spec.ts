import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ProductService from '#services/product_service'
import { createAdminUser } from '#tests/helpers/admin'

const productPayload = {
  title: 'Linen Shirt',
  description: null,
  status: 'active',
  price: 25,
  options: [],
}

async function seedProduct() {
  const productService = await app.container.make(ProductService)
  const product = await productService.create({
    title: 'Linen Shirt',
    description: null,
    status: 'draft',
    price: 25,
    options: [],
  })
  const { product: detail } = await productService.findDetail(product.id)
  return { product, variant: detail.variants[0] }
}

test.group('Staff products: shipping fields', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a product with a weight and ships free', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json({ ...productPayload, weight: 1.25, freeShipping: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    const { data } = response.body()
    assert.isTrue(data.freeShipping)
    assert.equal(data.variants[0].weight, 1.25)
    const variant = await ProductVariant.findOrFail(data.variants[0].id)
    assert.equal(variant.weight, 1.25)
  })

  test('defaults to no weight and not shipping free', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products')
      .json(productPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    assert.isFalse(response.body().data.freeShipping)
    assert.isNull(response.body().data.variants[0].weight)
  })

  test('rejects a weight or freeShipping of the wrong type', async ({ client }) => {
    const user = await createAdminUser('admin')
    const invalid: [string, unknown][] = [
      ['weight', '1.5'],
      ['weight', -1],
      ['weight', 1.2345],
      ['weight', 100_000],
      ['freeShipping', 'yes'],
      ['freeShipping', 1],
    ]

    for (const [field, value] of invalid) {
      const response = await client
        .post('/admin/products')
        .json({ ...productPayload, [field]: value })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })
    }
  })

  test('turns ships free on and keeps it when omitted', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedProduct()

    const enabled = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Linen Shirt', description: null, status: 'draft', freeShipping: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    enabled.assertStatus(200)
    assert.isTrue(enabled.body().data.freeShipping)

    const omitted = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Linen Shirt', description: null, status: 'draft' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    omitted.assertStatus(200)
    await product.refresh()
    assert.isTrue(product.freeShipping)
  })

  test('saves, keeps and clears a variant weight', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variant } = await seedProduct()
    const url = `/admin/products/${product.id}/variants/${variant.id}`
    const fields = {
      sku: null,
      barcode: null,
      price: 25,
      compareAtPrice: null,
      trackInventory: false,
    }
    const put = (body: Record<string, unknown>) =>
      client.put(url).json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user)

    const saved = await put({ ...fields, weight: 0.75 })
    saved.assertStatus(200)
    assert.equal(saved.body().data.weight, 0.75)

    const kept = await put({ ...fields, price: 30 })
    kept.assertStatus(200)
    assert.equal(kept.body().data.weight, 0.75)

    const cleared = await put({ ...fields, weight: null })
    cleared.assertStatus(200)
    assert.isNull(cleared.body().data.weight)
  })

  test('rejects a variant weight that is not a number', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variant } = await seedProduct()

    const response = await client
      .put(`/admin/products/${product.id}/variants/${variant.id}`)
      .json({
        sku: null,
        barcode: null,
        price: 25,
        compareAtPrice: null,
        trackInventory: false,
        weight: '2',
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'weight' }] })
  })

  test('requires the products.edit permission to change ships free', async ({ client, assert }) => {
    const user = await createAdminUser(['products.view'])
    const { product } = await seedProduct()

    const response = await client
      .put(`/admin/products/${product.id}`)
      .json({ title: 'Linen Shirt', description: null, status: 'draft', freeShipping: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
    const saved = await Product.findOrFail(product.id)
    assert.isFalse(saved.freeShipping)
  })
})
