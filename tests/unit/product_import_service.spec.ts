import { randomUUID } from 'node:crypto'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { errors } from '@vinejs/vine'
import { PRODUCT_IMPORT_COLUMNS, PRODUCT_IMPORT_SAMPLE_ROWS } from '#constants/product_import'
import AuditLog from '#models/audit_log'
import InventoryLevel from '#models/inventory_level'
import OptionDefinition from '#models/option_definition'
import Product from '#models/product'
import ProductType from '#models/product_type'
import ProductVariant from '#models/product_variant'
import Vendor from '#models/vendor'
import type { CsvExportActor } from '#services/base_csv_transfer_service'
import LocationService from '#services/location_service'
import ProductImageService, { type ImportedImage } from '#services/product_image_service'
import ProductImportService from '#services/product_import_service'
import { createAdminUser } from '#tests/helpers/admin'
import { ensureOptionDefinition } from '#tests/helpers/catalog_options'
import { ensureProductType, ensureVendor } from '#tests/helpers/collections'

type Row = Partial<Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>>

let actor: CsvExportActor

async function csvFile(content: string): Promise<MultipartFile> {
  const dir = await mkdtemp(join(tmpdir(), 'product-import-'))
  const tmpPath = join(dir, 'products.csv')
  await writeFile(tmpPath, content)
  return { tmpPath } as MultipartFile
}

function rowsCsv(rows: Row[]): string {
  const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const lines = rows.map((row) => PRODUCT_IMPORT_COLUMNS.map((c) => cell(row[c] ?? '')).join(','))
  return [PRODUCT_IMPORT_COLUMNS.join(','), ...lines].join('\n')
}

/** Stores no files and downloads nothing, so the sample's image URLs stay offline. */
class FakeProductImageService extends ProductImageService {
  async importFromUrl(): Promise<ImportedImage> {
    return { key: `products/${randomUUID()}.jpg`, uploaded: true }
  }

  async remove(): Promise<void> {}
}

async function importRows(rows: Row[]) {
  const service = await app.container.make(ProductImportService)
  return service.import(await csvFile(rowsCsv(rows)), actor)
}

test.group('ProductImportService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    actor = { user: await createAdminUser('admin'), ipAddress: null }
  })
  group.each.setup(() => {
    app.container.swap(ProductImageService, () => new FakeProductImageService())
    return () => app.container.restore(ProductImageService)
  })
  group.each.timeout(10_000)

  test('the sample CSV imports cleanly', async ({ assert }) => {
    await ensureOptionDefinition('Size', ['Small', 'Medium'])
    const service = await app.container.make(ProductImportService)

    const result = await service.import(await csvFile(await service.sampleCsv()), actor)

    const handles = new Set(PRODUCT_IMPORT_SAMPLE_ROWS.map(({ handle }) => handle))
    assert.deepEqual(result, {
      created: handles.size,
      updated: 0,
      skipped: 0,
      errors: [],
      errorCount: 0,
    })
  })

  test("the sample CSV uses the store's own option values", async ({ assert }) => {
    await OptionDefinition.query().update({ isActive: false })
    await ensureOptionDefinition('Fit', ['Slim', 'Relaxed'])
    await OptionDefinition.query().where('name', 'Fit').update({ isActive: true })
    const service = await app.container.make(ProductImportService)

    const sample = await service.sampleCsv()

    assert.include(sample, ',Fit,Slim,')
    assert.include(sample, ',Relaxed,')
    const result = await service.import(await csvFile(sample), actor)
    assert.equal(result.errorCount, 0)
  })

  test('the sample CSV falls back to a default variant without options', async ({ assert }) => {
    await OptionDefinition.query().update({ isActive: false })
    const service = await app.container.make(ProductImportService)

    const sample = await service.sampleCsv()

    const result = await service.import(await csvFile(sample), actor)
    assert.equal(result.errorCount, 0)
    const product = await Product.query().whereLike('slug', 'classic-tee-%').firstOrFail()
    const variants = await ProductVariant.query().where('product_id', product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['Default Title']
    )
  })

  test('the sample CSV can be imported again from a new download', async ({ assert }) => {
    const service = await app.container.make(ProductImportService)

    const first = await service.import(await csvFile(await service.sampleCsv()), actor)
    const second = await service.import(await csvFile(await service.sampleCsv()), actor)

    assert.equal(first.errorCount, 0)
    assert.equal(second.errorCount, 0)
    assert.equal(second.created, first.created)
  })

  test("the sample CSV uses the store's vendor and product type", async ({ assert }) => {
    await Vendor.query().update({ isActive: false })
    await ProductType.query().update({ isActive: false })
    await (await ensureVendor('Akinai')).merge({ isActive: true }).save()
    await (await ensureProductType('Gift box')).merge({ isActive: true }).save()
    const service = await app.container.make(ProductImportService)

    const result = await service.import(await csvFile(await service.sampleCsv()), actor)

    assert.equal(result.errorCount, 0)
    const product = await Product.query()
      .whereLike('slug', 'classic-tee-%')
      .preload('vendor')
      .preload('productType')
      .firstOrFail()
    assert.equal(product.vendor?.name, 'Akinai')
    assert.equal(product.productType?.name, 'Gift box')
  })

  test('the sample CSV quotes cells containing commas', async ({ assert }) => {
    const service = await app.container.make(ProductImportService)
    assert.include(await service.sampleCsv(), '"cotton, summer"')
  })

  test('the sample CSV neutralizes formula-like option values', async ({ assert }) => {
    await OptionDefinition.query().update({ isActive: false })
    await ensureOptionDefinition('=Evil', ['=1+1', '@SUM(A1)'])
    await OptionDefinition.query().where('name', '=Evil').update({ isActive: true })
    const service = await app.container.make(ProductImportService)

    const sample = await service.sampleCsv()

    assert.include(sample, ",'=Evil,'=1+1,")
    assert.notInclude(sample, ',=Evil,')
  })

  test('lists the allowed values for an unknown option value', async ({ assert }) => {
    await ensureOptionDefinition('Size', ['S', 'M'])
    const service = await app.container.make(ProductImportService)

    const result = await service.import(
      await csvFile(
        rowsCsv([
          { handle: 'tee', title: 'Tee', option1_name: 'Size', option1_value: 'Small', price: '1' },
          { handle: 'tee', option1_value: 'Medium', price: '1' },
        ])
      ),
      actor
    )

    assert.equal(result.created, 0)
    assert.deepEqual(
      result.errors.map(({ row, field }) => ({ row, field })),
      [
        { row: 2, field: 'option1_value' },
        { row: 3, field: 'option1_value' },
      ]
    )
    assert.include(result.errors[0].message, 'Use one of: S, M')
  })

  test('matches option names and values ignoring case', async ({ assert }) => {
    await ensureOptionDefinition('Size', ['Small', 'Medium'])
    const service = await app.container.make(ProductImportService)

    const result = await service.import(
      await csvFile(
        rowsCsv([
          { handle: 'tee', title: 'Tee', option1_name: 'size', option1_value: 'SMALL', price: '1' },
          { handle: 'tee', option1_value: 'medium', price: '2' },
        ])
      ),
      actor
    )

    assert.equal(result.created, 1)
    const product = await Product.findByOrFail('slug', 'tee')
    const variants = await ProductVariant.query()
      .where('product_id', product.id)
      .orderBy('position')
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['Small', 'Medium']
    )
  })

  test('groups rows by handle and skips the whole product on any error', async ({ assert }) => {
    await ensureOptionDefinition('Size', ['Small', 'Medium'])
    const service = await app.container.make(ProductImportService)

    const result = await service.import(
      await csvFile(
        rowsCsv([
          { handle: 'tee', title: 'Tee', option1_name: 'Size', option1_value: 'Small', price: '1' },
          { handle: 'tee', option1_value: 'Medium', price: 'oops' },
          { handle: 'mug', title: 'Mug', price: '3' },
        ])
      ),
      actor
    )

    assert.equal(result.created, 1)
    assert.equal(result.skipped, 1)
    assert.deepEqual(
      result.errors.map(({ row, field }) => ({ row, field })),
      [{ row: 3, field: 'price' }]
    )
    assert.isNull(await Product.findBy('slug', 'tee'))
    assert.isNotNull(await Product.findBy('slug', 'mug'))
  })

  test('reports repeated option combinations and missing values', async ({ assert }) => {
    await ensureOptionDefinition('Size', ['Small'])
    const service = await app.container.make(ProductImportService)

    const result = await service.import(
      await csvFile(
        rowsCsv([
          { handle: 'a', title: 'A', option1_name: 'Size', option1_value: 'Small', price: '1' },
          { handle: 'a', option1_value: 'Small', price: '1' },
          { handle: 'b', title: 'B', option1_name: 'Size', price: '1' },
          { handle: 'c', title: 'C', price: '1' },
          { handle: 'c', price: '1' },
          { handle: 'd', title: 'D', option2_value: 'Red', price: '1' },
        ])
      ),
      actor
    )

    assert.equal(result.created, 0)
    assert.equal(result.skipped, 4)
    assert.deepEqual(
      result.errors.map(({ row, field }) => ({ row, field })),
      [
        { row: 3, field: null },
        { row: 4, field: 'option1_value' },
        { row: 6, field: null },
        { row: 7, field: 'option2_value' },
      ]
    )
  })

  test('requires a title on the first row of a product', async ({ assert }) => {
    const service = await app.container.make(ProductImportService)

    const result = await service.import(
      await csvFile(rowsCsv([{ handle: 'x', price: '1' }])),
      actor
    )

    assert.equal(result.created, 0)
    assert.deepEqual(result.errors[0], {
      row: 2,
      field: 'title',
      message: 'The first row of a product needs a title.',
    })
  })

  test('accepts a header with a BOM and different letter case', async ({ assert }) => {
    const service = await app.container.make(ProductImportService)
    const header = PRODUCT_IMPORT_COLUMNS.map((column) => column.toUpperCase()).join(',')
    const row = PRODUCT_IMPORT_COLUMNS.map((c) =>
      c === 'handle' ? 'mug' : c === 'title' ? 'Mug' : c === 'price' ? '1' : ''
    ).join(',')

    const result = await service.import(await csvFile(`\uFEFF${header}\r\n${row}\r\n`), actor)

    assert.equal(result.created, 1)
  })

  test('accepts spreadsheet-style TRUE / FALSE booleans', async ({ assert }) => {
    const rows: Row[] = [
      {
        handle: 'upper-bool',
        title: 'Upper Bool',
        price: '1',
        charge_tax: 'FALSE',
        track_inventory: 'True',
        inventory_quantity: '3',
      },
    ]

    const result = await importRows(rows)

    assert.equal(result.errorCount, 0)
    const product = await Product.findByOrFail('slug', 'upper-bool')
    assert.isFalse(product.chargeTax)
    const [variant] = await ProductVariant.query().where('product_id', product.id)
    assert.isTrue(variant.trackInventory)
  })

  test('rejects reordered columns', async ({ assert }) => {
    const service = await app.container.make(ProductImportService)
    const header = [...PRODUCT_IMPORT_COLUMNS].reverse().join(',')

    await assert.rejects(
      () => csvFile(`${header}\n`).then((file) => service.import(file, actor)),
      errors.E_VALIDATION_ERROR
    )
  })
})

test.group('ProductImportService: existing handles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    actor = { user: await createAdminUser('admin'), ipAddress: null }
  })
  group.each.timeout(10_000)

  test('updates the product and its variant in place', async ({ assert }) => {
    await importRows([{ handle: 'mug', title: 'Mug', status: 'draft', sku: 'MUG-1', price: '5' }])
    const product = await Product.findByOrFail('slug', 'mug')
    const [before] = await ProductVariant.query().where('product_id', product.id)

    const result = await importRows([
      { handle: 'mug', title: 'Big Mug', status: 'active', sku: 'MUG-1', price: '7.50' },
    ])

    assert.deepEqual(result, { created: 0, updated: 1, skipped: 0, errors: [], errorCount: 0 })
    await product.refresh()
    assert.equal(product.title, 'Big Mug')
    assert.equal(product.status, 'active')
    const variants = await ProductVariant.query().where('product_id', product.id)
    assert.lengthOf(variants, 1)
    assert.equal(variants[0].id, before.id)
    assert.equal(variants[0].price, 7.5)
    assert.equal(variants[0].sku, 'MUG-1')
  })

  test('keeps the current value for empty cells', async ({ assert }) => {
    await ensureVendor('Acme')
    await importRows([
      {
        handle: 'mug',
        title: 'Mug',
        description: '<p>Hi</p>',
        vendor: 'Acme',
        tags: 'kitchen, gift',
        seo_title: 'Mug SEO',
        charge_tax: 'false',
        sku: 'MUG-1',
        barcode: '123',
        price: '5',
      },
    ])

    const result = await importRows([{ handle: 'mug', price: '6' }])

    assert.equal(result.updated, 1)
    const product = await Product.query()
      .where('slug', 'mug')
      .preload('vendor')
      .preload('tags')
      .firstOrFail()
    assert.equal(product.title, 'Mug')
    assert.equal(product.description, '<p>Hi</p>')
    assert.equal(product.vendor?.name, 'Acme')
    assert.equal(product.seoTitle, 'Mug SEO')
    assert.isFalse(product.chargeTax)
    assert.sameMembers(
      product.tags.map(({ name }) => name),
      ['kitchen', 'gift']
    )
    const [variant] = await ProductVariant.query().where('product_id', product.id)
    assert.equal(variant.sku, 'MUG-1')
    assert.equal(variant.barcode, '123')
    assert.equal(variant.price, 6)
  })

  test('replaces tags when the tags cell is set', async ({ assert }) => {
    await importRows([{ handle: 'mug', title: 'Mug', tags: 'kitchen, gift', price: '5' }])

    await importRows([{ handle: 'mug', tags: 'sale', price: '5' }])

    const product = await Product.query().where('slug', 'mug').preload('tags').firstOrFail()
    assert.deepEqual(
      product.tags.map(({ name }) => name),
      ['sale']
    )
  })

  test('adds new option values as variants and keeps variants not in the file', async ({
    assert,
  }) => {
    await ensureOptionDefinition('Size', ['Small', 'Medium', 'Large'])
    await importRows([
      { handle: 'tee', title: 'Tee', option1_name: 'Size', option1_value: 'Small', price: '1' },
      { handle: 'tee', option1_value: 'Medium', price: '2' },
    ])
    const product = await Product.findByOrFail('slug', 'tee')
    const before = await ProductVariant.query().where('product_id', product.id).orderBy('position')

    const result = await importRows([
      { handle: 'tee', option1_name: 'Size', option1_value: 'medium', price: '9' },
      { handle: 'tee', option1_value: 'Large', price: '10' },
    ])

    assert.equal(result.updated, 1)
    assert.equal(result.errorCount, 0)
    const after = await ProductVariant.query()
      .where('product_id', product.id)
      .orderBy('position')
      .preload('optionValues')
    assert.deepEqual(
      after.map(({ title, price, position }) => [title, price, position]),
      [
        ['Small', 1, 0],
        ['Medium', 9, 1],
        ['Large', 10, 2],
      ]
    )
    assert.equal(after[1].id, before[1].id)
    assert.equal(after[2].optionValues[0]?.value, 'Large')
  })

  test("rejects option names that don't match the product's options", async ({ assert }) => {
    await ensureOptionDefinition('Size', ['Small'])
    await importRows([{ handle: 'mug', title: 'Mug', price: '5' }])

    const result = await importRows([
      { handle: 'mug', option1_name: 'Size', option1_value: 'Small', price: '6' },
    ])

    assert.equal(result.updated, 0)
    assert.equal(result.skipped, 1)
    assert.deepEqual(
      result.errors.map(({ row, field }) => ({ row, field })),
      [{ row: 2, field: 'option1_name' }]
    )
    const [variant] = await ProductVariant.query().whereHas('product', (query) =>
      query.where('slug', 'mug')
    )
    assert.equal(variant.price, 5)
  })

  test("rejects another product's SKU but accepts the variant's own", async ({ assert }) => {
    await importRows([
      { handle: 'a', title: 'A', sku: 'A-1', price: '1' },
      { handle: 'b', title: 'B', sku: 'B-1', price: '1' },
    ])

    const taken = await importRows([{ handle: 'a', sku: 'b-1', price: '2' }])
    const own = await importRows([{ handle: 'a', sku: 'A-1', price: '3' }])

    assert.equal(taken.updated, 0)
    assert.deepEqual(
      taken.errors.map(({ field }) => field),
      ['sku']
    )
    assert.equal(own.updated, 1)
    assert.equal((await ProductVariant.findByOrFail('sku', 'A-1')).price, 3)
  })

  test('sets stock at the default location for tracked variants', async ({ assert }) => {
    const location = await (await app.container.make(LocationService)).ensureDefault('Main')
    await importRows([
      {
        handle: 'mug',
        title: 'Mug',
        sku: 'MUG-1',
        price: '5',
        track_inventory: 'true',
        inventory_quantity: '5',
      },
    ])

    await importRows([{ handle: 'mug', price: '5', inventory_quantity: '12' }])
    await importRows([
      { handle: 'mug', price: '5', track_inventory: 'false', inventory_quantity: '99' },
    ])

    const variant = await ProductVariant.findByOrFail('sku', 'MUG-1')
    const level = await InventoryLevel.query()
      .where('product_variant_id', variant.id)
      .where('location_id', location.id)
      .firstOrFail()
    assert.equal(level.available, 12)
    assert.isFalse(variant.trackInventory)
  })

  test('restores an archived product when the file sets a status', async ({ assert }) => {
    await importRows([{ handle: 'mug', title: 'Mug', price: '5' }])
    await Product.query()
      .where('slug', 'mug')
      .update({ status: 'archived', archivedAt: DateTime.now() })

    await importRows([{ handle: 'mug', status: 'active', price: '5' }])

    const product = await Product.findByOrFail('slug', 'mug')
    assert.equal(product.status, 'active')
    assert.isNull(product.archivedAt)
  })

  test('records one import event instead of one entry per product', async ({ assert }) => {
    await importRows([
      { handle: 'a', title: 'A', price: '1' },
      { handle: 'b', title: 'B', price: '1' },
    ])
    await importRows([
      { handle: 'a', price: '2' },
      { handle: 'c', title: 'C', price: '1' },
    ])

    const events = await AuditLog.query()
      .where('action', 'products_imported')
      .where('user_id', actor.user.id)
      .orderBy('created_at', 'asc')
    assert.deepEqual(
      events.map(({ changes }) => changes.after),
      [
        { created: 2, updated: 0, skipped: 0 },
        { created: 1, updated: 1, skipped: 0 },
      ]
    )
    const perProduct = await AuditLog.query()
      .where('auditable_type', 'Product')
      .whereIn('action', ['created', 'updated'])
    assert.lengthOf(perProduct, 0)
  })
})
