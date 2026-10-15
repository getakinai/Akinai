import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { parse } from 'csv-parse/sync'
import { PRODUCT_IMPORT_COLUMNS } from '#constants/product_import'
import InventoryLevel from '#models/inventory_level'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import type { CsvExportActor } from '#services/base_csv_transfer_service'
import LocationService from '#services/location_service'
import ProductExportService from '#services/product_export_service'
import ProductImportService from '#services/product_import_service'
import { createAdminUser } from '#tests/helpers/admin'
import { ensureOptionDefinition } from '#tests/helpers/catalog_options'
import { ensureProductType, ensureVendor } from '#tests/helpers/collections'

type Row = Partial<Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>>

async function csvFile(content: string): Promise<MultipartFile> {
  const dir = await mkdtemp(join(tmpdir(), 'product-export-'))
  const tmpPath = join(dir, 'products.csv')
  await writeFile(tmpPath, content)
  return { tmpPath } as MultipartFile
}

function rowsCsv(rows: Row[]): string {
  const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const lines = rows.map((row) => PRODUCT_IMPORT_COLUMNS.map((c) => cell(row[c] ?? '')).join(','))
  return [PRODUCT_IMPORT_COLUMNS.join(','), ...lines].join('\n')
}

/** Data rows of an export, keyed by column, limited to the given handles. */
function exportedRows(csv: string, handles: string[]): Row[] {
  const records = parse(csv, { columns: true, bom: true }) as Row[]
  return records.filter(({ handle }) => handles.includes(handle ?? ''))
}

const tee: Row[] = [
  {
    handle: 'export-tee',
    title: 'Export Tee',
    description: '<p>Soft, cotton "tee"</p>',
    status: 'active',
    vendor: 'Export Vendor',
    product_type: 'Export Type',
    tags: 'summer, cotton',
    charge_tax: 'true',
    option1_name: 'Size',
    option1_value: 'Small',
    sku: 'EXP-TEE-S',
    barcode: '111',
    price: '499',
    compare_at_price: '599.5',
    track_inventory: 'true',
    inventory_quantity: '20',
  },
  {
    handle: 'export-tee',
    option1_value: 'Medium',
    sku: 'EXP-TEE-M',
    price: '519.50',
    track_inventory: 'true',
    inventory_quantity: '15',
  },
]

const giftCard: Row[] = [
  {
    handle: 'export-gift',
    title: 'Export Gift',
    status: 'draft',
    charge_tax: 'false',
    sku: 'EXP-GIFT',
    price: '1000',
    track_inventory: 'false',
  },
]

async function seed(rows: Row[]) {
  await ensureOptionDefinition('Size', ['Small', 'Medium'])
  await ensureVendor('Export Vendor')
  await ensureProductType('Export Type')
  await (await app.container.make(LocationService)).ensureDefault('Main')
  const importer = await app.container.make(ProductImportService)
  const result = await importer.import(await csvFile(rowsCsv(rows)), await importActor())
  if (result.errorCount > 0) throw new Error(JSON.stringify(result.errors))
}

async function importActor(): Promise<CsvExportActor> {
  return { user: await createAdminUser('admin'), ipAddress: null }
}

test.group('ProductExportService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('writes the import header and one row per variant', async ({ assert }) => {
    await seed([...tee, ...giftCard])
    const service = await app.container.make(ProductExportService)

    const { csv, filename } = await service.exportCsv({ sort: 'title', direction: 'asc' })

    assert.isTrue(csv.startsWith(`${PRODUCT_IMPORT_COLUMNS.join(',')}\r\n`))
    assert.match(filename, /^products-\d{4}-\d{2}-\d{2}\.csv$/)
    assert.deepEqual(exportedRows(csv, ['export-tee', 'export-gift']), [
      {
        handle: 'export-gift',
        title: 'Export Gift',
        description: '',
        status: 'draft',
        vendor: '',
        product_type: '',
        tags: '',
        charge_tax: 'false',
        option1_name: '',
        option1_value: '',
        option2_name: '',
        option2_value: '',
        option3_name: '',
        option3_value: '',
        sku: 'EXP-GIFT',
        barcode: '',
        price: '1000.00',
        compare_at_price: '',
        track_inventory: 'false',
        inventory_quantity: '',
        seo_title: '',
        seo_description: '',
        image_urls: '',
      },
      {
        handle: 'export-tee',
        title: 'Export Tee',
        description: '<p>Soft, cotton "tee"</p>',
        status: 'active',
        vendor: 'Export Vendor',
        product_type: 'Export Type',
        tags: 'cotton, summer',
        charge_tax: 'true',
        option1_name: 'Size',
        option1_value: 'Small',
        option2_name: '',
        option2_value: '',
        option3_name: '',
        option3_value: '',
        sku: 'EXP-TEE-S',
        barcode: '111',
        price: '499.00',
        compare_at_price: '599.50',
        track_inventory: 'true',
        inventory_quantity: '20',
        seo_title: '',
        seo_description: '',
        image_urls: '',
      },
      {
        handle: 'export-tee',
        title: '',
        description: '',
        status: '',
        vendor: '',
        product_type: '',
        tags: '',
        charge_tax: '',
        option1_name: '',
        option1_value: 'Medium',
        option2_name: '',
        option2_value: '',
        option3_name: '',
        option3_value: '',
        sku: 'EXP-TEE-M',
        barcode: '',
        price: '519.50',
        compare_at_price: '',
        track_inventory: 'true',
        inventory_quantity: '15',
        seo_title: '',
        seo_description: '',
        image_urls: '',
      },
    ])
  })

  test('re-imports cleanly once handles and SKUs are free', async ({ assert }) => {
    await seed([...tee, ...giftCard])
    const exporter = await app.container.make(ProductExportService)
    const importer = await app.container.make(ProductImportService)
    const { csv } = await exporter.exportCsv()

    const handles = ['export-tee', 'export-gift']
    const rows = exportedRows(csv, handles)
    const products = await Product.query().whereIn('slug', handles)
    const variantIds = (
      await ProductVariant.query().whereIn(
        'product_id',
        products.map(({ id }) => id)
      )
    ).map(({ id }) => id)
    await InventoryLevel.query().whereIn('product_variant_id', variantIds).delete()
    await ProductVariant.query().whereIn('id', variantIds).delete()
    await Product.query().whereIn('slug', handles).delete()

    const result = await importer.import(await csvFile(rowsCsv(rows)), await importActor())

    assert.deepEqual(result, { created: 2, updated: 0, skipped: 0, errors: [], errorCount: 0 })
    const again = exportedRows((await exporter.exportCsv()).csv, handles)
    const bySku = (list: Row[]) =>
      [...list].sort((a, b) => (a.sku ?? '').localeCompare(b.sku ?? ''))
    assert.deepEqual(bySku(again), bySku(rows))
  })

  test('writes archived products as draft', async ({ assert }) => {
    await seed(giftCard)
    await Product.query().where('slug', 'export-gift').update({ status: 'archived' })
    const service = await app.container.make(ProductExportService)

    const { csv } = await service.exportCsv({ status: 'archived' })

    const [row] = exportedRows(csv, ['export-gift'])
    assert.equal(row.status, 'draft')
  })

  test('applies the status filter', async ({ assert }) => {
    await seed([...tee, ...giftCard])
    const service = await app.container.make(ProductExportService)

    const { csv, productCount } = await service.exportCsv({ status: 'active' })

    const handles = exportedRows(csv, ['export-tee', 'export-gift']).map(({ handle }) => handle)
    assert.sameMembers([...new Set(handles)], ['export-tee'])
    assert.isAtLeast(productCount, 1)
  })

  test('sums stock across locations for tracked variants', async ({ assert }) => {
    await seed(tee)
    const locations = await app.container.make(LocationService)
    const second = await locations.create({
      name: 'Second store',
      addressLine: '1 Cuba St',
      city: 'Wellington',
      country: 'NZ',
    })
    const small = await ProductVariant.findByOrFail('sku', 'EXP-TEE-S')
    await InventoryLevel.create({
      productVariantId: small.id,
      locationId: second.id,
      available: 5,
      committed: 0,
      incoming: 0,
    })
    const service = await app.container.make(ProductExportService)

    const { csv } = await service.exportCsv()

    const row = exportedRows(csv, ['export-tee']).find(({ sku }) => sku === 'EXP-TEE-S')
    assert.equal(row?.inventory_quantity, '25')
  })

  test('neutralises cells a spreadsheet would run as a formula', async ({ assert }) => {
    await seed([{ ...giftCard[0], title: '=HYPERLINK("x")' }])
    const service = await app.container.make(ProductExportService)

    const { csv } = await service.exportCsv()

    assert.include(csv, `"'=HYPERLINK(""x"")"`)
  })
})
