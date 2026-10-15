import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import InventoryLevel from '#models/inventory_level'
import Location from '#models/location'
import LocationService from '#services/location_service'
import ProductService from '#services/product_service'

test.group('LocationService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('ensureDefault creates the default location only once', async ({ assert }) => {
    const locationService = await app.container.make(LocationService)

    const first = await locationService.ensureDefault('Main warehouse')
    const second = await locationService.ensureDefault('Another name')

    assert.equal(first.id, second.id)
    assert.isTrue(first.isDefault)
    assert.isTrue(first.isActive)
    assert.lengthOf(await Location.query().where('is_default', true), 1)
  })

  test('totalUnits sums every inventory state at the location', async ({ assert }) => {
    const locationService = await app.container.make(LocationService)
    const productService = await app.container.make(ProductService)
    const location = await locationService.create({
      name: 'Shop',
      addressLine: null,
      city: 'Wellington',
      country: 'NZ',
    })
    const product = await productService.create({
      title: 'Candle',
      description: null,
      status: 'draft',
      price: 8,
      options: [],
    })
    const { product: detail } = await productService.findDetail(product.id)

    assert.equal(await locationService.totalUnits(location), 0)

    await InventoryLevel.create({
      productVariantId: detail.variants[0].id,
      locationId: location.id,
      available: 2,
      committed: 1,
      incoming: 3,
    })

    assert.equal(await locationService.totalUnits(location), 6)
  })

  test('archive and unarchive toggle the active flag', async ({ assert }) => {
    const locationService = await app.container.make(LocationService)
    const location = await locationService.create({
      name: 'Overflow',
      addressLine: null,
      city: null,
      country: null,
    })

    const archived = await locationService.archive(location)
    assert.isFalse(archived.isActive)

    const restored = await locationService.unarchive(location)
    assert.isTrue(restored.isActive)
  })
})
