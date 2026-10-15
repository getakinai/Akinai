import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import InventoryLevel from '#models/inventory_level'
import ProductVariant from '#models/product_variant'
import LocationService from '#services/location_service'
import ProductService from '#services/product_service'
import { createAdminUser } from '#tests/helpers/admin'
import {
  ensureCatalogOptions,
  sizeAndColorOptions,
  sizeOnlyOptions,
  type CatalogFixture,
} from '#tests/helpers/catalog_options'

const UNKNOWN_ID = '01a11382-716f-7774-83b7-09aa5f030a10'

async function seedCatalog(
  optionsFn: (catalog: CatalogFixture) => ReturnType<typeof sizeOnlyOptions>,
  status: 'draft' | 'active' = 'draft'
) {
  const catalog = await ensureCatalogOptions()
  const productService = await app.container.make(ProductService)
  const locationService = await app.container.make(LocationService)
  const location = await locationService.ensureDefault('Main warehouse')
  const product = await productService.create({
    title: 'Classic T-Shirt',
    description: null,
    status,
    price: 25,
    options: optionsFn(catalog),
  })
  const { product: detail } = await productService.findDetail(product.id)
  const valueIds = (optionIndex: number) => detail.options[optionIndex].values.map(({ id }) => id)
  return { product, location, variants: detail.variants, valueIds, catalog }
}

const variantsUrl = (productId: string) => `/admin/products/${productId}/variants`

const variantUrl = (productId: string, id: string) => `${variantsUrl(productId)}/${id}`

const variantPayload = {
  sku: 'CTS-S',
  barcode: '9400000000001',
  price: 27.5,
  compareAtPrice: 30,
  trackInventory: true,
}

test.group('Admin product options: update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('keeps matching variants and adds only new combinations', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, location, variants, catalog } = await seedCatalog((c) =>
      sizeOnlyOptions(c, ['S', 'M'])
    )
    const [small, medium] = variants
    await small.merge({ sku: 'CTS-S', trackInventory: true }).save()
    await InventoryLevel.create({
      productVariantId: small.id,
      locationId: location.id,
      available: 7,
    })

    const response = await client
      .put(`/admin/products/${product.id}/options`)
      .json({ options: sizeOnlyOptions(catalog, ['S', 'L']) })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.deepEqual(
      data.variants.map((variant: { title: string }) => variant.title),
      ['S', 'L']
    )
    assert.equal(data.variants[0].id, small.id)
    assert.equal(data.variants[0].sku, 'CTS-S')
    assert.equal(data.variants[0].availableTotal, 7)
    assert.isNull(await ProductVariant.find(medium.id))
  })

  test('does not recreate a variant deleted by hand', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants, catalog } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[1].delete()

    const response = await client
      .put(`/admin/products/${product.id}/options`)
      .json({ options: sizeOnlyOptions(catalog, ['S', 'M', 'L']) })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.variants.map((variant: { title: string }) => variant.title),
      ['S', 'L']
    )
  })

  test('rejects adding the same catalog option twice', async ({ client }) => {
    const user = await createAdminUser('admin')
    const catalog = await ensureCatalogOptions()
    const { product } = await seedCatalog((c) => sizeOnlyOptions(c, ['S']))

    const response = await client
      .put(`/admin/products/${product.id}/options`)
      .json({
        options: [
          { optionDefinitionId: catalog.sizeId, optionDefinitionValueIds: [catalog.sizeValues.S] },
          { optionDefinitionId: catalog.sizeId, optionDefinitionValueIds: [catalog.sizeValues.M] },
        ],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'options', rule: 'distinctDefinitions' }] })
  })

  test('rejects an option without values', async ({ client }) => {
    const user = await createAdminUser('admin')
    const catalog = await ensureCatalogOptions()
    const { product } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(`/admin/products/${product.id}/options`)
      .json({
        options: [{ optionDefinitionId: catalog.sizeId, optionDefinitionValueIds: [] }],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('refuses an archived product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await product.merge({ status: 'archived' }).save()

    const response = await client
      .put(`/admin/products/${product.id}/options`)
      .json({ options: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })
})

test.group('Admin variants: pages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renders the create and edit shells', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const create = await client
      .get(`${variantsUrl(product.id)}/create`)
      .withGuard('web')
      .loginAs(user)
    const edit = await client
      .get(`${variantsUrl(product.id)}/edit/${variants[0].id}`)
      .withGuard('web')
      .loginAs(user)

    create.assertStatus(200)
    edit.assertStatus(200)
  })

  test('requires the products.edit permission for the shells', async ({ client }) => {
    const user = await createAdminUser(['products.view'])
    const { product } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .get(`${variantsUrl(product.id)}/create`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Admin variants: view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns the variant with its option value ids and stock rows', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser(['products.view'])
    const { product, variants, valueIds } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .get(`${variantsUrl(product.id)}/view/${variants[0].id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.id, variants[0].id)
    assert.equal(data.productId, product.id)
    assert.deepEqual(data.optionValueIds, [valueIds(0)[0]])
    assert.lengthOf(data.inventory, 1)
  })

  test('returns 404 when the variant belongs to another product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    const other = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .get(`${variantsUrl(other.product.id)}/view/${variants[0].id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('rejects a product id that is not a UUID', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .get(`${variantsUrl('not-a-uuid')}/view/${variants[0].id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'params.productId' }] })
  })
})

test.group('Admin variants: store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('adds a variant for a free combination at the end', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants, valueIds } = await seedCatalog((c) =>
      sizeAndColorOptions(c, ['S', 'M'], ['Red', 'Blue'])
    )
    const mediumBlue = variants.find(({ title }) => title === 'M / Blue')!
    await mediumBlue.delete()

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [valueIds(1)[1], valueIds(0)[1]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.title, 'M / Blue')
    assert.equal(data.productId, product.id)
    assert.equal(data.sku, 'CTS-S')
    assert.deepEqual(data.optionValueIds, [valueIds(0)[1], valueIds(1)[1]])
    assert.equal(data.position, 3)
  })

  test('rejects a combination another variant already uses', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, valueIds } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[0]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'optionValueIds', message: 'S already exists' }],
    })
  })

  test('rejects option values from another product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[1].delete()
    const other = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [other.valueIds(0)[1]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'optionValueIds' }] })
  })

  test('requires one value for every option', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, valueIds } = await seedCatalog((c) =>
      sizeAndColorOptions(c, ['S'], ['Red', 'Blue'])
    )

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[0]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'optionValueIds', message: 'Choose one Color value' }],
    })
  })

  test('refuses a product without options', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedCatalog(() => [])

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ message: 'Add an option before adding variants' }] })
  })

  test('refuses an archived product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, valueIds } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await product.merge({ status: 'archived' }).save()

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[1]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 404 for an unknown product', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post(variantsUrl(UNKNOWN_ID))
      .json({ ...variantPayload, optionValueIds: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('requires the products.edit permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])
    const { product, valueIds } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .post(variantsUrl(product.id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[1]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Admin variants: update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('updates SKU, barcode, prices and tracking', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json(variantPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: variantPayload })
    await variants[0].refresh()
    assert.equal(variants[0].sku, 'CTS-S')
    assert.equal(variants[0].price, 27.5)
  })

  test('moves the variant to another free combination', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants, valueIds } = await seedCatalog((c) =>
      sizeOnlyOptions(c, ['S', 'M', 'L'])
    )
    await variants[2].delete()

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[2]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().data.title, 'L')
    assert.deepEqual(response.body().data.optionValueIds, [valueIds(0)[2]])
  })

  test('rejects moving onto a combination another variant uses', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants, valueIds } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[1]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'optionValueIds', message: 'M already exists' }],
    })
  })

  test('allows resending its own combination', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants, valueIds } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json({ ...variantPayload, optionValueIds: [valueIds(0)[0]] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
  })

  test('rejects a SKU used by another variant, ignoring case', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[1].merge({ sku: 'cts-s' }).save()

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json(variantPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'sku' }] })
  })

  test('allows a variant to keep its own SKU', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[0].merge({ sku: 'CTS-S' }).save()

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json(variantPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
  })

  test('rejects negative prices and more than two decimals', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json({ ...variantPayload, price: -1, compareAtPrice: 1.234 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'price' }, { field: 'compareAtPrice' }] })
  })

  test('requires the products.edit permission', async ({ client }) => {
    const user = await createAdminUser(['products.view', 'inventory.edit'])
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(product.id, variants[0].id))
      .json(variantPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('returns 404 for an unknown variant', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(product.id, UNKNOWN_ID))
      .json(variantPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('returns 404 when the variant belongs to another product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    const other = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(variantUrl(other.product.id, variants[0].id))
      .json(variantPayload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })
})

test.group('Admin variants: delete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('deletes the variant and its stock levels', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants, location } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await InventoryLevel.create({
      productVariantId: variants[1].id,
      locationId: location.id,
      available: 3,
    })

    const response = await client
      .delete(variantUrl(product.id, variants[1].id))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    assert.isNull(await ProductVariant.find(variants[1].id))
    assert.isNull(await InventoryLevel.findBy('product_variant_id', variants[1].id))
    assert.isNotNull(await ProductVariant.find(variants[0].id))
  })

  test('refuses to delete the last variant', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog(() => [])

    const response = await client
      .delete(variantUrl(product.id, variants[0].id))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ message: 'A product needs at least one variant' }] })
    assert.isNotNull(await ProductVariant.find(variants[0].id))
  })

  test('refuses an archived product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await product.merge({ status: 'archived' }).save()

    const response = await client
      .delete(variantUrl(product.id, variants[1].id))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('returns 404 when the variant belongs to another product', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    const other = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .delete(variantUrl(other.product.id, variants[1].id))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
    assert.isNotNull(await ProductVariant.find(variants[1].id))
  })

  test('requires the products.edit permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])
    const { product, variants } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .delete(variantUrl(product.id, variants[1].id))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Admin variants: inventory', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('refuses a variant without inventory tracking', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants, location } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))

    const response = await client
      .put(`${variantUrl(product.id, variants[0].id)}/inventory`)
      .json({ levels: [{ locationId: location.id, available: 5 }] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ message: 'Turn on inventory tracking for this variant first' }],
    })
  })

  test('sets and then updates the available quantity', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { product, variants, location } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    const variant = variants[0]
    await variant.merge({ trackInventory: true }).save()

    for (const available of [12, 4]) {
      const response = await client
        .put(`${variantUrl(product.id, variant.id)}/inventory`)
        .json({ levels: [{ locationId: location.id, available }] })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

      response.assertStatus(200)
      assert.equal(response.body().data.availableTotal, available)
    }

    const levels = await InventoryLevel.query().where('product_variant_id', variant.id)
    assert.lengthOf(levels, 1)
    assert.equal(levels[0].available, 4)
  })

  test('rejects archived locations, negative and fractional quantities', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { product, variants, location } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[0].merge({ trackInventory: true }).save()
    const locationService = await app.container.make(LocationService)
    const closed = await locationService.create({
      name: 'Closed shop',
      addressLine: null,
      city: null,
      country: null,
    })
    await locationService.archive(closed)

    const response = await client
      .put(`${variantUrl(product.id, variants[0].id)}/inventory`)
      .json({
        levels: [
          { locationId: location.id, available: -1 },
          { locationId: closed.id, available: 1.5 },
        ],
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'levels.0.available' },
        { field: 'levels.1.locationId' },
        { field: 'levels.1.available' },
      ],
    })
  })

  test('requires the inventory.edit permission', async ({ client }) => {
    const user = await createAdminUser(['products.view', 'products.edit'])
    const { product, variants, location } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[0].merge({ trackInventory: true }).save()

    const response = await client
      .put(`${variantUrl(product.id, variants[0].id)}/inventory`)
      .json({ levels: [{ locationId: location.id, available: 5 }] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('returns 404 when the variant belongs to another product', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { variants, location } = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    const other = await seedCatalog((c) => sizeOnlyOptions(c, ['S', 'M']))
    await variants[0].merge({ trackInventory: true }).save()

    const response = await client
      .put(`${variantUrl(other.product.id, variants[0].id)}/inventory`)
      .json({ levels: [{ locationId: location.id, available: 5 }] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })
})
