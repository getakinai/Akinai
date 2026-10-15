import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { PRODUCT_IMPORT_COLUMNS } from '#constants/product_import'
import AuditLog from '#models/audit_log'
import { createAdminUser } from '#tests/helpers/admin'
import { createTestProduct } from '#tests/helpers/collections'

const HEADER = PRODUCT_IMPORT_COLUMNS.join(',')

test.group('Staff products: CSV export', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('downloads the products as an import-ready CSV', async ({ client, assert }) => {
    const product = await createTestProduct({ title: 'Export Me' })
    const user = await createAdminUser(['products.export'])

    const response = await client.get('/admin/products/export').withGuard('web').loginAs(user)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'text/csv')
    assert.match(
      response.header('content-disposition') ?? '',
      /attachment; filename="products-\d{4}-\d{2}-\d{2}\.csv"/
    )
    assert.equal(response.header('x-content-type-options'), 'nosniff')
    assert.isTrue(response.text().startsWith(`${HEADER}\r\n`))
    assert.include(response.text(), `${product.slug},Export Me,`)
  })

  test('records the export as a security event', async ({ client, assert }) => {
    await createTestProduct({ title: 'Export Me' })
    const user = await createAdminUser(['products.export'])

    const response = await client
      .get('/admin/products/export')
      .qs({ status: 'active' })
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const log = await AuditLog.query()
      .where('action', 'products_exported')
      .where('user_id', user.id)
      .firstOrFail()
    assert.equal(log.auditableId, user.id)
    assert.deepInclude(log.changes?.after as object, { status: 'active', q: null })
  })

  test('applies the status filter from the query string', async ({ client, assert }) => {
    const active = await createTestProduct({ title: 'Active One' })
    const draft = await createTestProduct({ title: 'Draft One', status: 'draft' })
    const user = await createAdminUser(['products.export'])

    const response = await client
      .get('/admin/products/export')
      .qs({ status: 'draft' })
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.include(response.text(), `${draft.slug},Draft One,`)
    assert.notInclude(response.text(), `${active.slug},`)
  })

  test('rejects an unknown status or sort key', async ({ client }) => {
    const user = await createAdminUser(['products.export'])

    const response = await client
      .get('/admin/products/export')
      .qs({ status: 'deleted', sort: 'price; drop table products' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('requires the products.export permission', async ({ client }) => {
    const user = await createAdminUser(['products.view', 'products.import'])

    const response = await client
      .get('/admin/products/export')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.get('/admin/products/export').accept('json')
    response.assertStatus(401)
  })
})
