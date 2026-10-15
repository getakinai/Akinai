import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import InventoryLevel from '#models/inventory_level'
import ProductVariant from '#models/product_variant'
import LocationService from '#services/location_service'
import ProductService from '#services/product_service'
import {
  ensureCatalogOptions,
  ensureOptionDefinition,
  pickCatalogOptions,
  sizeAndColorOptions,
  sizeOnlyOptions,
} from '#tests/helpers/catalog_options'

async function setup() {
  const productService = await app.container.make(ProductService)
  const locationService = await app.container.make(LocationService)
  const location = await locationService.ensureDefault('Main warehouse')
  return { productService, location }
}

async function variantsOf(productService: ProductService, productId: string) {
  const { product } = await productService.findDetail(productId)
  return product.variants
}

test.group('ProductService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('creates a single default variant when there are no options', async ({ assert }) => {
    const { productService } = await setup()
    const product = await productService.create({
      title: 'Plain Mug',
      description: null,
      status: 'draft',
      price: 9.5,
      options: [],
    })

    const variants = await variantsOf(productService, product.id)
    assert.lengthOf(variants, 1)
    assert.equal(variants[0].title, 'Default Title')
    assert.equal(variants[0].price, 9.5)
    assert.isFalse(variants[0].trackInventory)
    assert.isNull(variants[0].sku)
  })

  test('creates one variant per option combination at the given price', async ({ assert }) => {
    const { productService } = await setup()
    const size = await ensureOptionDefinition('Size', ['Small', 'Medium'])
    const color = await ensureOptionDefinition('Color', ['Black', 'White'])
    const product = await productService.create({
      title: 'Classic T-Shirt',
      description: 'Soft cotton',
      status: 'active',
      price: 25,
      options: [
        pickCatalogOptions(size, ['Small', 'Medium']),
        pickCatalogOptions(color, ['Black', 'White']),
      ],
    })

    const { product: detail } = await productService.findDetail(product.id)
    assert.deepEqual(
      detail.variants.map(({ title }) => title),
      ['Small / Black', 'Small / White', 'Medium / Black', 'Medium / White']
    )
    assert.isTrue(detail.variants.every(({ price }) => price === 25))
    assert.deepEqual(
      detail.options.map(({ name, values }) => [name, values.map(({ value }) => value)]),
      [
        ['Size', ['Small', 'Medium']],
        ['Color', ['Black', 'White']],
      ]
    )
  })

  test('generates a unique slug from the title', async ({ assert }) => {
    const { productService } = await setup()
    const input = {
      title: 'Classic T-Shirt',
      description: null,
      status: 'draft' as const,
      price: 1,
      options: [],
    }

    const first = await productService.create(input)
    const second = await productService.create(input)

    assert.equal(first.slug, 'classic-t-shirt')
    assert.equal(second.slug, 'classic-t-shirt-2')
  })

  test('regenerating options keeps matching variants with their SKU and stock', async ({
    assert,
  }) => {
    const { productService, location } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Hoodie',
      description: null,
      status: 'draft',
      price: 40,
      options: sizeOnlyOptions(catalog, ['S', 'M']),
    })
    const [small, medium] = await variantsOf(productService, product.id)
    await small.merge({ sku: 'HOOD-S', price: 42, trackInventory: true }).save()
    await InventoryLevel.create({
      productVariantId: small.id,
      locationId: location.id,
      available: 7,
    })
    await InventoryLevel.create({
      productVariantId: medium.id,
      locationId: location.id,
      available: 3,
    })

    await productService.syncOptions(product, sizeOnlyOptions(catalog, ['S', 'L']))

    const variants = await variantsOf(productService, product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['S', 'L']
    )
    assert.equal(variants[0].id, small.id)
    assert.equal(variants[0].sku, 'HOOD-S')
    assert.equal(variants[0].inventoryLevels[0].available, 7)
    assert.equal(variants[1].price, 42)
    assert.isNull(await ProductVariant.find(medium.id))
    assert.isNull(await InventoryLevel.findBy('product_variant_id', medium.id))
  })

  test('reordering options keeps every variant', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Cap',
      description: null,
      status: 'draft',
      price: 15,
      options: sizeAndColorOptions(catalog, ['S', 'M'], ['Red', 'Blue']),
    })
    const before = await variantsOf(productService, product.id)

    await productService.syncOptions(product, [
      {
        optionDefinitionId: catalog.colorId,
        optionDefinitionValueIds: [catalog.colorValues.Red, catalog.colorValues.Blue],
      },
      {
        optionDefinitionId: catalog.sizeId,
        optionDefinitionValueIds: [catalog.sizeValues.S, catalog.sizeValues.M],
      },
    ])

    const after = await variantsOf(productService, product.id)
    assert.sameMembers(
      after.map(({ id }) => id),
      before.map(({ id }) => id)
    )
    assert.equal(after[0].title, 'Red / S')
  })

  test('adding the first options carries the default variant over', async ({ assert }) => {
    const { productService } = await setup()
    const color = await ensureOptionDefinition('Color', ['Natural', 'Black'])
    const product = await productService.create({
      title: 'Tote',
      description: null,
      status: 'draft',
      price: 20,
      options: [],
    })
    const [defaultVariant] = await variantsOf(productService, product.id)
    await defaultVariant.merge({ sku: 'TOTE' }).save()

    await productService.syncOptions(product, [
      pickCatalogOptions(color, ['Natural', 'Black']),
    ])

    const variants = await variantsOf(productService, product.id)
    assert.lengthOf(variants, 2)
    assert.equal(variants[0].id, defaultVariant.id)
    assert.equal(variants[0].title, 'Natural')
    assert.equal(variants[0].sku, 'TOTE')
  })

  test('removing every option keeps the first variant as the default', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Socks',
      description: null,
      status: 'draft',
      price: 5,
      options: sizeOnlyOptions(catalog, ['S', 'M']),
    })
    const [first, second] = await variantsOf(productService, product.id)

    await productService.syncOptions(product, [])

    const variants = await variantsOf(productService, product.id)
    assert.lengthOf(variants, 1)
    assert.equal(variants[0].id, first.id)
    assert.equal(variants[0].title, 'Default Title')
    assert.isNull(await ProductVariant.find(second.id))
  })

  test('adding a value creates only its new combinations', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Polo',
      description: null,
      status: 'draft',
      price: 30,
      options: sizeAndColorOptions(catalog, ['S', 'M'], ['Red']),
    })
    const before = await variantsOf(productService, product.id)

    await productService.syncOptions(
      product,
      sizeAndColorOptions(catalog, ['S', 'M'], ['Red', 'Blue'])
    )

    const after = await variantsOf(productService, product.id)
    assert.deepEqual(
      after.map(({ title }) => title),
      ['S / Red', 'S / Blue', 'M / Red', 'M / Blue']
    )
    assert.includeMembers(
      after.map(({ id }) => id),
      before.map(({ id }) => id)
    )
  })

  test('adding an option gives existing variants its first value', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const color = await ensureOptionDefinition('Color', ['Black', 'Olive'])
    const product = await productService.create({
      title: 'Jacket',
      description: null,
      status: 'draft',
      price: 90,
      options: sizeOnlyOptions(catalog, ['S', 'M']),
    })
    const [small, medium] = await variantsOf(productService, product.id)

    await productService.syncOptions(product, [
      ...sizeOnlyOptions(catalog, ['S', 'M']),
      pickCatalogOptions(color, ['Black', 'Olive']),
    ])

    const variants = await variantsOf(productService, product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['S / Black', 'S / Olive', 'M / Black', 'M / Olive']
    )
    assert.equal(variants[0].id, small.id)
    assert.equal(variants[2].id, medium.id)
  })

  test('a variant deleted by hand is not recreated', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Shorts',
      description: null,
      status: 'draft',
      price: 35,
      options: sizeOnlyOptions(catalog, ['S', 'M']),
    })
    const [, medium] = await variantsOf(productService, product.id)
    await medium.delete()

    await productService.syncOptions(product, sizeOnlyOptions(catalog, ['S', 'M', 'L']))

    const variants = await variantsOf(productService, product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['S', 'L']
    )
  })

  test('removing an option collapses variants onto the remaining ones', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Gloves',
      description: null,
      status: 'draft',
      price: 18,
      options: sizeAndColorOptions(catalog, ['S', 'M'], ['Red', 'Blue']),
    })
    const before = await variantsOf(productService, product.id)

    await productService.syncOptions(product, sizeOnlyOptions(catalog, ['S', 'M']))

    const variants = await variantsOf(productService, product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['S', 'M']
    )
    assert.equal(variants[0].id, before[0].id)
    assert.equal(variants[1].id, before[2].id)
  })

  test('creates the full matrix when no variant would remain', async ({ assert }) => {
    const { productService } = await setup()
    const catalog = await ensureCatalogOptions()
    const product = await productService.create({
      title: 'Bandana',
      description: null,
      status: 'draft',
      price: 8,
      options: [
        {
          optionDefinitionId: catalog.colorId,
          optionDefinitionValueIds: [catalog.colorValues.Red, catalog.colorValues.Blue],
        },
      ],
    })
    const [, blue] = await variantsOf(productService, product.id)
    await blue.delete()

    await productService.syncOptions(product, [
      {
        optionDefinitionId: catalog.colorId,
        optionDefinitionValueIds: [catalog.colorValues.Blue],
      },
    ])

    const variants = await variantsOf(productService, product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['Blue']
    )
    assert.equal(variants[0].price, 8)
  })

  test('archives and unarchives as active', async ({ assert }) => {
    const { productService } = await setup()
    const product = await productService.create({
      title: 'Scarf',
      description: null,
      status: 'active',
      price: 30,
      options: [],
    })

    const archived = await productService.archive(product)
    assert.equal(archived.status, 'archived')
    assert.isNotNull(archived.archivedAt)

    const restored = await productService.unarchive(archived)
    assert.equal(restored.status, 'active')
    assert.isNull(restored.archivedAt)
  })

  test('bulk unarchive restores archived products as active and skips the rest', async ({
    assert,
  }) => {
    const { productService } = await setup()
    const create = (title: string) =>
      productService.create({ title, description: null, status: 'active', price: 30, options: [] })
    const scarf = await create('Scarf')
    const hat = await create('Hat')
    await productService.archive(scarf)

    const result = await productService.bulkSetArchived([scarf.id, hat.id], false)

    assert.equal(result.updated, 1)
    assert.equal(result.skipped, 1)
    await scarf.refresh()
    assert.equal(scarf.status, 'active')
    assert.isNull(scarf.archivedAt)
  })

  test('paginate reports variant counts, stock and price range', async ({ assert }) => {
    const { productService, location } = await setup()
    const color = await ensureOptionDefinition('Color', ['Grey', 'Navy'])
    const product = await productService.create({
      title: 'Beanie',
      description: null,
      status: 'active',
      price: 10,
      options: [pickCatalogOptions(color, ['Grey', 'Navy'])],
    })
    const [grey, navy] = await variantsOf(productService, product.id)
    await navy.merge({ price: 12 }).save()
    await InventoryLevel.create({
      productVariantId: grey.id,
      locationId: location.id,
      available: 4,
    })

    const page = await productService.paginate({ q: 'beanie' })
    const [row] = page.all()

    assert.equal(Number(row.$extras.variants_count), 2)
    assert.equal(Number(row.$extras.available_total), 4)
    assert.equal(Number(row.$extras.price_min), 10)
    assert.equal(Number(row.$extras.price_max), 12)
  })

  test('paginate searches variant SKUs and filters by status', async ({ assert }) => {
    const { productService } = await setup()
    const product = await productService.create({
      title: 'Wallet',
      description: null,
      status: 'draft',
      price: 50,
      options: [],
    })
    const [variant] = await variantsOf(productService, product.id)
    await variant.merge({ sku: 'WAL-BRN' }).save()

    const bySku = await productService.paginate({ q: 'wal-brn' })
    const activeOnly = await productService.paginate({ q: 'wal-brn', status: 'active' })

    assert.lengthOf(bySku.all(), 1)
    assert.lengthOf(activeOnly.all(), 0)
  })
})
