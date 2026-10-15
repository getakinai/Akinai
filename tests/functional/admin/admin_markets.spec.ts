import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import MarketService from '#services/market_service'
import { createAdminUser } from '#tests/helpers/admin'

const oceania = {
  name: 'Oceania',
  currencyCode: 'NZD',
  pricesIncludeTax: true,
  countryCodes: ['NZ', 'AU'],
}

async function createMarket(overrides: Partial<typeof oceania> = {}) {
  const marketService = await app.container.make(MarketService)
  return marketService.create({ ...oceania, ...overrides })
}

async function createPrimary() {
  const marketService = await app.container.make(MarketService)
  return marketService.ensurePrimary({
    name: 'Philippines',
    currencyCode: 'PHP',
    pricesIncludeTax: true,
    countryCodes: ['PH'],
  })
}

test.group('Staff markets: list and view', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists markets with their country count, primary first', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await createMarket()
    await createPrimary()

    const response = await client
      .get('/admin/markets/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const rows = response.body().data
    assert.equal(rows[0].name, 'Philippines')
    assert.isTrue(rows[0].isPrimary)
    assert.equal(rows[1].countriesCount, 2)
  })

  test('views a market with its countries', async ({ client, assert }) => {
    const user = await createAdminUser(['markets.view'])
    const market = await createMarket()

    const response = await client
      .get(`/admin/markets/view/${market.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.sameMembers(response.body().data.countryCodes, ['NZ', 'AU'])
  })

  test('requires the markets.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/markets/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff markets: store and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a market', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/markets')
      .json({ ...oceania, currencyCode: 'nzd', countryCodes: ['nz'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        name: 'Oceania',
        handle: 'oceania',
        currencyCode: 'NZD',
        isPrimary: false,
        isActive: true,
        countryCodes: ['NZ'],
      },
    })
  })

  test('rejects a country another market already covers', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createMarket()

    const response = await client
      .post('/admin/markets')
      .json({ ...oceania, name: 'Pacific', countryCodes: ['FJ', 'NZ'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'countryCodes', message: 'New Zealand already belongs to another market' }],
    })
  })

  test('rejects unknown countries, bad currencies and duplicate names', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createMarket()

    const response = await client
      .post('/admin/markets')
      .json({ ...oceania, name: 'OCEANIA', currencyCode: 'dollars', countryCodes: ['XX'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'name' }, { field: 'currencyCode' }, { field: 'countryCodes.0' }],
    })
  })

  test('requires the markets.create permission', async ({ client }) => {
    const user = await createAdminUser(['markets.view'])

    const response = await client
      .post('/admin/markets')
      .json(oceania)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('updates a market and keeps its own countries', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const market = await createMarket()

    const response = await client
      .put(`/admin/markets/${market.id}`)
      .json({ ...oceania, handle: 'anz', countryCodes: ['NZ', 'FJ'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().data.handle, 'anz')
    assert.sameMembers(response.body().data.countryCodes, ['NZ', 'FJ'])
  })

  test('rejects an invalid or taken handle', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createMarket({ name: 'Europe', countryCodes: [] })
    const market = await createMarket()

    const response = await client
      .put(`/admin/markets/${market.id}`)
      .json({ ...oceania, handle: 'europe' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'handle' }] })
  })

  test('refuses to edit an archived market', async ({ client }) => {
    const user = await createAdminUser('admin')
    const marketService = await app.container.make(MarketService)
    const market = await marketService.archive(await createMarket())

    const response = await client
      .put(`/admin/markets/${market.id}`)
      .json({ ...oceania, handle: 'oceania' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })
})

test.group('Staff markets: archive and unarchive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('archives a market and restores it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const market = await createMarket()

    const archived = await client
      .post(`/admin/markets/${market.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    archived.assertStatus(200)
    assert.isFalse(archived.body().data.isActive)

    const restored = await client
      .post(`/admin/markets/${market.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    restored.assertStatus(200)
    assert.isTrue(restored.body().data.isActive)
  })

  test('refuses to archive the primary market', async ({ client }) => {
    const user = await createAdminUser('admin')
    const primary = await createPrimary()

    const response = await client
      .post(`/admin/markets/${primary.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ message: 'The primary market cannot be archived' }],
    })
  })

  test('requires the markets.archive permission', async ({ client }) => {
    const user = await createAdminUser(['markets.view', 'markets.edit'])
    const market = await createMarket()

    const response = await client
      .post(`/admin/markets/${market.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})
