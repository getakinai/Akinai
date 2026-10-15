import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type { Permission } from '#abilities/permissions'
import { PRODUCT_IMPORT_COLUMNS } from '#constants/product_import'
import AuditLog from '#models/audit_log'
import InventoryLevel from '#models/inventory_level'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import LocationService from '#services/location_service'
import { createAdminUser } from '#tests/helpers/admin'
import { ensureOptionDefinition } from '#tests/helpers/catalog_options'
import { createTestProduct, ensureVendor } from '#tests/helpers/collections'

type Row = Partial<Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>>

const HEADER = PRODUCT_IMPORT_COLUMNS.join(',')

function csv(rows: Row[], header = HEADER): Buffer {
  const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const lines = rows.map((row) => PRODUCT_IMPORT_COLUMNS.map((c) => cell(row[c] ?? '')).join(','))
  return Buffer.from([header, ...lines].join('\n'))
}

const tee: Row[] = [
  {
    handle: 'classic-tee',
    title: 'Classic Tee',
    status: 'active',
    tags: 'cotton, Summer',
    option1_name: 'Size',
    option1_value: 'Small',
    sku: 'TEE-S',
    price: '499.00',
    track_inventory: 'true',
    inventory_quantity: '20',
  },
  {
    handle: 'classic-tee',
    option1_value: 'Medium',
    sku: 'TEE-M',
    price: '519.50',
    compare_at_price: '599',
    track_inventory: 'true',
    inventory_quantity: '15',
  },
]

async function upload(
  client: ApiClient,
  file: Buffer,
  permissions: Permission[] | 'admin' = 'admin',
  filename = 'products.csv'
) {
  const user = await createAdminUser(permissions)
  return client
    .post('/admin/products/import')
    .file('file', file, { filename })
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

test.group('Staff products: CSV import', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('creates products with variants, tags and stock', async ({ client, assert }) => {
    await ensureOptionDefinition('Size', ['Small', 'Medium'])
    const location = await (await app.container.make(LocationService)).ensureDefault('Main')

    const response = await upload(client, csv(tee))

    response.assertStatus(200)
    response.assertBodyContains({ data: { created: 1, skipped: 0, errorCount: 0, errors: [] } })

    const product = await Product.query()
      .where('slug', 'classic-tee')
      .preload('tags')
      .preload('options')
      .firstOrFail()
    assert.equal(product.title, 'Classic Tee')
    assert.equal(product.status, 'active')
    assert.sameMembers(
      product.tags.map(({ name }) => name),
      ['cotton', 'summer']
    )
    assert.lengthOf(product.options, 1)

    const variants = await ProductVariant.query()
      .where('product_id', product.id)
      .orderBy('position')
    assert.deepEqual(
      variants.map(({ title, sku, price }) => [title, sku, price]),
      [
        ['Small', 'TEE-S', 499],
        ['Medium', 'TEE-M', 519.5],
      ]
    )
    assert.equal(variants[1].compareAtPrice, 599)
    assert.isTrue(variants[0].trackInventory)

    const levels = await InventoryLevel.query()
      .whereIn(
        'product_variant_id',
        variants.map(({ id }) => id)
      )
      .where('location_id', location.id)
    assert.sameMembers(
      levels.map(({ available }) => available),
      [20, 15]
    )

    const events = await AuditLog.query().where('action', 'products_imported')
    assert.lengthOf(events, 1)
    assert.deepEqual(events[0].changes.after, { created: 1, updated: 0, skipped: 0 })
    const perProduct = await AuditLog.query()
      .where('auditable_type', 'Product')
      .where('auditable_id', product.id)
    assert.lengthOf(perProduct, 0)
  })

  test('creates a default variant for a product without options', async ({ client, assert }) => {
    const response = await upload(
      client,
      csv([{ handle: 'gift-card', title: 'Gift Card', price: '1000', charge_tax: 'false' }])
    )

    response.assertStatus(200)
    const product = await Product.findByOrFail('slug', 'gift-card')
    assert.equal(product.status, 'draft')
    assert.isFalse(product.chargeTax)
    const variants = await ProductVariant.query().where('product_id', product.id)
    assert.deepEqual(
      variants.map(({ title }) => title),
      ['Default Title']
    )
  })

  test('updates products whose handle already exists', async ({ client, assert }) => {
    const existing = await createTestProduct({ title: 'Classic Tee', price: 100 })
    await existing.merge({ slug: 'classic-tee' }).save()
    const [variant] = await ProductVariant.query().where('product_id', existing.id)

    const response = await upload(
      client,
      csv([
        { handle: 'classic-tee', title: 'Classic Tee v2', sku: 'TEE-1', price: '250' },
        { handle: 'mug', title: 'Mug', price: '5' },
      ])
    )

    response.assertStatus(200)
    response.assertBodyContains({ data: { created: 1, updated: 1, skipped: 0, errorCount: 0 } })
    await existing.refresh()
    assert.equal(existing.title, 'Classic Tee v2')
    await variant.refresh()
    assert.equal(variant.price, 250)
    assert.equal(variant.sku, 'TEE-1')
    assert.lengthOf(await ProductVariant.query().where('product_id', existing.id), 1)
  })

  test("skips rows using another product's SKU", async ({ client, assert }) => {
    const existing = await createTestProduct({ title: 'Classic Tee' })
    await ProductVariant.query().where('product_id', existing.id).update({ sku: 'MUG-1' })

    const response = await upload(
      client,
      csv([{ handle: 'mug', title: 'Mug', sku: 'mug-1', price: '5' }])
    )

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.created, 0)
    assert.equal(data.skipped, 1)
    assert.deepEqual(
      data.errors.map(({ row, field }: { row: number; field: string }) => ({ row, field })),
      [{ row: 2, field: 'sku' }]
    )
    assert.lengthOf(await Product.query().where('slug', 'mug'), 0)
  })

  test('reports SKUs repeated within the file', async ({ client, assert }) => {
    const response = await upload(
      client,
      csv([
        { handle: 'a', title: 'A', sku: 'DUP', price: '1' },
        { handle: 'b', title: 'B', sku: 'dup', price: '1' },
        { handle: 'c', title: 'C', sku: 'OK', price: '1' },
      ])
    )

    response.assertStatus(200)
    response.assertBodyContains({ data: { created: 1, skipped: 2 } })
    assert.lengthOf(await Product.query().where('slug', 'c'), 1)
  })

  test('rejects unknown vendors, options and option values', async ({ client, assert }) => {
    await ensureOptionDefinition('Size', ['Small'])
    await ensureVendor('Archived Co', false)

    const response = await upload(
      client,
      csv([
        { handle: 'one', title: 'One', vendor: 'Archived Co', price: '1' },
        {
          handle: 'two',
          title: 'Two',
          option1_name: 'Material',
          option1_value: 'Wool',
          price: '1',
        },
        {
          handle: 'three',
          title: 'Three',
          option1_name: 'Size',
          option1_value: 'Huge',
          price: '1',
        },
      ])
    )

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.created, 0)
    assert.includeDeepMembers(
      data.errors.map(({ field }: { field: string }) => field),
      ['vendor', 'option1_name', 'option1_value']
    )
  })

  test('validates cell types and bounds', async ({ client, assert }) => {
    const response = await upload(
      client,
      csv([
        { handle: 'Bad Handle!', title: 'X', price: '1' },
        { handle: 'neg', title: 'Neg', price: '-5' },
        { handle: 'nan', title: 'NaN', price: 'abc' },
        { handle: 'status', title: 'Status', status: 'published', price: '1' },
        { handle: 'stock', title: 'Stock', price: '1', inventory_quantity: '1.5' },
      ])
    )

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.created, 0)
    assert.equal(data.skipped, 5)
    assert.includeMembers(
      data.errors.map(({ field }: { field: string }) => field),
      ['handle', 'price', 'status', 'inventory_quantity']
    )
  })

  test('treats SQL in cells as plain text', async ({ client, assert }) => {
    const title = "Robert'); DROP TABLE products;--"

    const response = await upload(
      client,
      csv([{ handle: 'bobby', title, sku: "x' OR '1'='1", price: '1' }])
    )

    response.assertStatus(200)
    const product = await Product.findByOrFail('slug', 'bobby')
    assert.equal(product.title, title)
    const variant = await ProductVariant.findByOrFail('product_id', product.id)
    assert.equal(variant.sku, "x' OR '1'='1")
  })

  test('sanitizes HTML in descriptions', async ({ client, assert }) => {
    const response = await upload(
      client,
      csv([
        {
          handle: 'html',
          title: 'Html',
          description: '<p>Hi</p><script>alert(1)</script><img src=x onerror=alert(1)>',
          price: '1',
        },
      ])
    )

    response.assertStatus(200)
    const product = await Product.findByOrFail('slug', 'html')
    assert.notInclude(product.description ?? '', '<script')
    assert.notInclude(product.description ?? '', 'onerror')
  })

  test('rejects a header that does not match the sample', async ({ client, assert }) => {
    const response = await upload(
      client,
      csv([{ handle: 'a', title: 'A', price: '1' }], HEADER.replace('title', 'name'))
    )

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'file' }] })
    assert.lengthOf(await Product.all(), 0)
  })

  test('rejects a file with no product rows', async ({ client }) => {
    const response = await upload(client, csv([]))

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'file' }] })
  })

  test('rejects more than 1000 rows', async ({ client, assert }) => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      handle: `p-${index}`,
      title: `P ${index}`,
      price: '1',
    }))

    const response = await upload(client, csv(rows))

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'file' }] })
    assert.lengthOf(await Product.all(), 0)
  })

  test('rejects a malformed CSV', async ({ client }) => {
    const response = await upload(client, Buffer.from(`${HEADER}\na,"unclosed`))

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'file' }] })
  })

  test('rejects files that are not .csv', async ({ client }) => {
    const response = await upload(client, csv(tee), 'admin', 'products.xlsx')

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'file' }] })
  })

  test('rejects a missing file', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/products/import')
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'file' }] })
  })

  test('requires the products.import permission', async ({ client, assert }) => {
    const response = await upload(client, csv([{ handle: 'a', title: 'A', price: '1' }]), [
      'products.view',
      'products.create',
    ])

    response.assertStatus(403)
    assert.lengthOf(await Product.all(), 0)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client
      .post('/admin/products/import')
      .file('file', csv([]), { filename: 'products.csv' })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(401)
  })
})

test.group('Staff products: CSV import sample', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('downloads the sample CSV', async ({ client, assert }) => {
    const user = await createAdminUser(['products.import'])

    const response = await client
      .get('/admin/products/import/sample')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'text/csv')
    assert.include(response.header('content-disposition'), 'attachment')
    assert.isTrue(response.text().startsWith(HEADER))
  })

  test('requires the products.import permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/products/import/sample')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.get('/admin/products/import/sample').accept('json')
    response.assertStatus(401)
  })
})
