import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import InventoryLevel from '#models/inventory_level'
import LocationService from '#services/location_service'
import ProductService from '#services/product_service'
import { createAdminUser } from '#tests/helpers/admin'

const shop = {
  name: 'Wellington shop',
  addressLine: '1 Cuba St',
  city: 'Wellington',
  country: 'NZ',
}

async function createLocation(name = shop.name) {
  const locationService = await app.container.make(LocationService)
  return locationService.create({ ...shop, name })
}

test.group('Staff locations: list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists locations with their available stock', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createLocation()

    const response = await client
      .get('/admin/locations/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const [row] = response.body().data
    assert.equal(row.name, 'Wellington shop')
    assert.equal(row.availableTotal, 0)
    assert.isTrue(row.isActive)
  })

  test('filters by status', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const locationService = await app.container.make(LocationService)
    await createLocation('Open')
    await locationService.archive(await createLocation('Closed'))

    const response = await client
      .get('/admin/locations/list')
      .qs({ status: 'archived' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    assert.deepEqual(
      response.body().data.map((row: { name: string }) => row.name),
      ['Closed']
    )
  })

  test('requires the locations.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/locations/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff locations: store and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a location', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/locations')
      .json(shop)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({ data: { ...shop, isActive: true, isDefault: false } })
  })

  test('rejects a duplicate name, ignoring case', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createLocation()

    const response = await client
      .post('/admin/locations')
      .json({ ...shop, name: 'WELLINGTON SHOP' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'name' }] })
  })

  test('requires the locations.create permission', async ({ client }) => {
    const user = await createAdminUser(['locations.view'])

    const response = await client
      .post('/admin/locations')
      .json(shop)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('updates a location and allows keeping its own name', async ({ client }) => {
    const user = await createAdminUser('admin')
    const location = await createLocation()

    const response = await client
      .put(`/admin/locations/${location.id}`)
      .json({ ...shop, city: 'Te Aro' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { name: shop.name, city: 'Te Aro' } })
  })
})

test.group('Staff locations: archive and unarchive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('archives an empty location and restores it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const location = await createLocation()

    const archived = await client
      .post(`/admin/locations/${location.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    archived.assertStatus(200)
    assert.isFalse(archived.body().data.isActive)

    const restored = await client
      .post(`/admin/locations/${location.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    restored.assertStatus(200)
    assert.isTrue(restored.body().data.isActive)
  })

  test('refuses to archive the default location', async ({ client }) => {
    const user = await createAdminUser('admin')
    const locationService = await app.container.make(LocationService)
    const location = await locationService.ensureDefault('Main warehouse')

    const response = await client
      .post(`/admin/locations/${location.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ message: 'The default location cannot be archived' }],
    })
  })

  test('refuses to archive a location that holds stock', async ({ client }) => {
    const user = await createAdminUser('admin')
    const location = await createLocation()
    const productService = await app.container.make(ProductService)
    const product = await productService.create({
      title: 'Candle',
      description: null,
      status: 'draft',
      price: 8,
      options: [],
    })
    const { product: detail } = await productService.findDetail(product.id)
    await InventoryLevel.create({
      productVariantId: detail.variants[0].id,
      locationId: location.id,
      available: 3,
    })

    const response = await client
      .post(`/admin/locations/${location.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('refuses to unarchive an active location', async ({ client }) => {
    const user = await createAdminUser('admin')
    const location = await createLocation()

    const response = await client
      .post(`/admin/locations/${location.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('requires the locations.archive permission', async ({ client }) => {
    const user = await createAdminUser(['locations.view', 'locations.edit'])
    const location = await createLocation()

    const response = await client
      .post(`/admin/locations/${location.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})
