import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import TaxService from '#services/tax_service'
import { createAdminUser } from '#tests/helpers/admin'

const vat = {
  name: 'VAT',
  countryCode: 'PH',
  regionCode: null as string | null,
  rate: 12,
  appliesToShipping: true,
}

async function createTaxRate(overrides: Partial<typeof vat> = {}) {
  const taxService = await app.container.make(TaxService)
  return taxService.create({ ...vat, ...overrides })
}

test.group('Staff taxes: list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists tax rates filtered by status', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const taxService = await app.container.make(TaxService)
    await createTaxRate()
    await taxService.archive(await createTaxRate({ countryCode: 'SG', name: 'GST' }))

    const response = await client
      .get('/admin/taxes/list')
      .qs({ status: 'active' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((row: { name: string }) => row.name),
      ['VAT']
    )
    assert.equal(response.body().data[0].rate, 12)
  })

  test('requires the taxes.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/taxes/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff taxes: store and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a tax rate', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/taxes')
      .json({ ...vat, countryCode: 'ph', regionCode: 'ncr', rate: 12.5 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({
      data: { countryCode: 'PH', regionCode: 'NCR', rate: 12.5, isActive: true },
    })
  })

  test('allows a region rate next to the country-wide rate', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createTaxRate()

    const response = await client
      .post('/admin/taxes')
      .json({ ...vat, regionCode: 'NCR' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
  })

  test('rejects a second country-wide rate', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createTaxRate()

    const response = await client
      .post('/admin/taxes')
      .json(vat)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'countryCode', message: 'This country already has a country-wide rate' }],
    })
  })

  test('rejects a second rate for the same region', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createTaxRate({ regionCode: 'NCR' })

    const response = await client
      .post('/admin/taxes')
      .json({ ...vat, regionCode: 'ncr' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'countryCode' }] })
  })

  test('rejects an unknown country and an out-of-range rate', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/taxes')
      .json({ ...vat, countryCode: 'XX', rate: 101 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'countryCode' }, { field: 'rate' }] })
  })

  test('requires the taxes.create permission', async ({ client }) => {
    const user = await createAdminUser(['taxes.view'])

    const response = await client
      .post('/admin/taxes')
      .json(vat)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('updates a tax rate and keeps its own country slot', async ({ client }) => {
    const user = await createAdminUser('admin')
    const taxRate = await createTaxRate()

    const response = await client
      .put(`/admin/taxes/${taxRate.id}`)
      .json({ ...vat, rate: 10, appliesToShipping: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { rate: 10, appliesToShipping: false } })
  })

  test('refuses to edit an archived tax rate', async ({ client }) => {
    const user = await createAdminUser('admin')
    const taxService = await app.container.make(TaxService)
    const taxRate = await taxService.archive(await createTaxRate())

    const response = await client
      .put(`/admin/taxes/${taxRate.id}`)
      .json(vat)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })
})

test.group('Staff taxes: archive and unarchive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('archives a tax rate and restores it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const taxRate = await createTaxRate()

    const archived = await client
      .post(`/admin/taxes/${taxRate.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    archived.assertStatus(200)
    assert.isFalse(archived.body().data.isActive)

    const again = await client
      .post(`/admin/taxes/${taxRate.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    again.assertStatus(422)

    const restored = await client
      .post(`/admin/taxes/${taxRate.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    restored.assertStatus(200)
    assert.isTrue(restored.body().data.isActive)
  })

  test('requires the taxes.archive permission', async ({ client }) => {
    const user = await createAdminUser(['taxes.view', 'taxes.edit'])
    const taxRate = await createTaxRate()

    const response = await client
      .post(`/admin/taxes/${taxRate.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})
