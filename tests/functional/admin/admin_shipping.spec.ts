import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import MarketService from '#services/market_service'
import ShippingService from '#services/shipping_service'
import { createAdminUser } from '#tests/helpers/admin'

const standard = {
  name: 'Standard',
  price: 150,
  minSubtotal: null,
  maxSubtotal: null,
  isActive: true,
}

async function createZone(name = 'Domestic', countryCodes = ['PH']) {
  const shippingService = await app.container.make(ShippingService)
  return shippingService.create({ name, countryCodes })
}

async function createRate(zoneName = 'Domestic') {
  const shippingService = await app.container.make(ShippingService)
  const zone = await createZone(zoneName, [])
  const rate = await shippingService.createRate(zone, standard)
  return { zone, rate }
}

test.group('Staff shipping: zones', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists zones with country and rate counts', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const shippingService = await app.container.make(ShippingService)
    const zone = await createZone('Domestic', ['PH'])
    await shippingService.createRate(zone, standard)

    const response = await client
      .get('/admin/shipping/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const [row] = response.body().data
    assert.equal(row.countriesCount, 1)
    assert.equal(row.ratesCount, 1)
  })

  test('views a zone with its countries and rates', async ({ client, assert }) => {
    const user = await createAdminUser(['shipping.view'])
    const shippingService = await app.container.make(ShippingService)
    const zone = await createZone('Domestic', ['PH'])
    await shippingService.createRate(zone, standard)

    const response = await client
      .get(`/admin/shipping/view/${zone.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(response.body().data.countryCodes, ['PH'])
    assert.equal(response.body().data.rates[0].price, 150)
  })

  test('creates a zone', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/shipping')
      .json({ name: 'Domestic', countryCodes: ['ph'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({
      data: { name: 'Domestic', isActive: true, countryCodes: ['PH'], rates: [] },
    })
  })

  test('rejects a country another zone already covers', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createZone('Domestic', ['PH'])

    const response = await client
      .post('/admin/shipping')
      .json({ name: 'Asia', countryCodes: ['PH', 'SG'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        { field: 'countryCodes', message: 'Philippines already belongs to another shipping zone' },
      ],
    })
  })

  test('updates a zone and keeps its own countries', async ({ client }) => {
    const user = await createAdminUser('admin')
    const zone = await createZone('Domestic', ['PH'])

    const response = await client
      .put(`/admin/shipping/${zone.id}`)
      .json({ name: 'Home', countryCodes: ['PH', 'GU'] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { name: 'Home', countryCodes: ['GU', 'PH'] } })
  })

  test('requires the shipping.create permission', async ({ client }) => {
    const user = await createAdminUser(['shipping.view'])

    const response = await client
      .post('/admin/shipping')
      .json({ name: 'Domestic', countryCodes: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('archives a zone and refuses edits until restored', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const zone = await createZone()

    const archived = await client
      .post(`/admin/shipping/${zone.id}/archive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    archived.assertStatus(200)
    assert.isFalse(archived.body().data.isActive)

    const update = await client
      .put(`/admin/shipping/${zone.id}`)
      .json({ name: 'Domestic', countryCodes: [] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    update.assertStatus(422)

    const restored = await client
      .post(`/admin/shipping/${zone.id}/unarchive`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    restored.assertStatus(200)
    assert.isTrue(restored.body().data.isActive)
  })
})

test.group('Staff shipping: regions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createRegionZone(name: string, regionCodes: string[]) {
    const shippingService = await app.container.make(ShippingService)
    return shippingService.create({ name, countryCodes: [], regionCodes })
  }

  function sendZone(
    client: ApiClient,
    user: Awaited<ReturnType<typeof createAdminUser>>,
    body: Record<string, unknown>,
    zoneId?: string
  ) {
    const request = zoneId
      ? client.put(`/admin/shipping/${zoneId}`)
      : client.post('/admin/shipping')
    return request.json(body).accept('json').withCsrfToken().withGuard('web').loginAs(user)
  }

  test('creates a zone covering provinces', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await sendZone(client, user, {
      name: 'PH Visayas',
      countryCodes: [],
      regionCodes: ['ph-ceb', 'PH-BOH'],
    })

    response.assertStatus(201)
    response.assertBodyContains({
      data: { name: 'PH Visayas', countryCodes: [], regionCodes: ['PH-BOH', 'PH-CEB'] },
    })
  })

  test('lists zones with their region count', async ({ client, assert }) => {
    const user = await createAdminUser(['shipping.view'])
    await createRegionZone('PH Visayas', ['PH-CEB', 'PH-BOH'])

    const response = await client
      .get('/admin/shipping/list')
      .qs({ q: 'Visayas' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const [row] = response.body().data
    assert.equal(row.countriesCount, 0)
    assert.equal(row.regionsCount, 2)
  })

  test('rejects a province another zone already covers, naming the zone', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createRegionZone('PH Visayas', ['PH-CEB'])

    const response = await sendZone(client, user, {
      name: 'Cebu Express',
      countryCodes: [],
      regionCodes: ['PH-CEB', 'PH-ILI'],
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'regionCodes',
          message: 'Cebu (PH Visayas) already belongs to another shipping zone',
        },
      ],
    })
  })

  test('rejects codes that are not in the province list', async ({ client }) => {
    const user = await createAdminUser('admin')

    for (const regionCodes of [['PH-XXX'], ['AU-NSW'], [12], 'PH-CEB']) {
      const response = await sendZone(client, user, {
        name: 'Somewhere',
        countryCodes: [],
        regionCodes,
      })
      response.assertStatus(422)
    }
  })

  test('rejects duplicate provinces', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await sendZone(client, user, {
      name: 'Twice',
      countryCodes: [],
      regionCodes: ['PH-CEB', 'PH-CEB'],
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'regionCodes' }] })
  })

  test('updates a zone and keeps its own provinces', async ({ client }) => {
    const user = await createAdminUser('admin')
    const zone = await createRegionZone('PH Visayas', ['PH-CEB'])

    const response = await sendZone(
      client,
      user,
      { name: 'PH Visayas', countryCodes: [], regionCodes: ['PH-CEB', 'PH-ILI'] },
      zone.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ data: { regionCodes: ['PH-CEB', 'PH-ILI'] } })
  })

  test('a whole country and its provinces can sit in different zones', async ({ client }) => {
    const user = await createAdminUser('admin')
    await createZone('Philippines', ['PH'])

    const response = await sendZone(client, user, {
      name: 'PH Metro Manila',
      countryCodes: [],
      regionCodes: ['PH-00'],
    })

    response.assertStatus(201)
  })

  test('lists the provinces each zone covers', async ({ client, assert }) => {
    const user = await createAdminUser(['shipping.view'])
    const zone = await createRegionZone('PH Visayas', ['PH-CEB'])

    const response = await client
      .get('/admin/shipping/regions')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepInclude(response.body().data, {
      regionCode: 'PH-CEB',
      zoneId: zone.id,
      zoneName: 'PH Visayas',
    })
  })

  test('lists the countries of active markets', async ({ client, assert }) => {
    const user = await createAdminUser(['shipping.view'])
    const marketService = await app.container.make(MarketService)
    await marketService.create({
      name: 'Pacific',
      currencyCode: 'USD',
      pricesIncludeTax: false,
      countryCodes: ['FJ'],
    })

    const response = await client
      .get('/admin/shipping/market-countries')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.include(response.body().data.countryCodes, 'FJ')
  })

  test('region and market lookups require the shipping.view permission', async ({ client }) => {
    const user = await createAdminUser(['shipping.create'])

    for (const url of ['/admin/shipping/regions', '/admin/shipping/market-countries']) {
      const response = await client.get(url).accept('json').withGuard('web').loginAs(user)
      response.assertStatus(403)
    }
  })
})

test.group('Staff shipping: rates', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('adds a rate to a zone', async ({ client }) => {
    const user = await createAdminUser('admin')
    const zone = await createZone()

    const response = await client
      .post(`/admin/shipping/${zone.id}/rates`)
      .json({ ...standard, name: 'Free over 1000', price: 0, minSubtotal: 1000 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({
      data: { shippingZoneId: zone.id, price: 0, minSubtotal: 1000, maxSubtotal: null },
    })
  })

  test('rejects a maximum below the minimum', async ({ client }) => {
    const user = await createAdminUser('admin')
    const zone = await createZone()

    const response = await client
      .post(`/admin/shipping/${zone.id}/rates`)
      .json({ ...standard, minSubtotal: 500, maxSubtotal: 100 })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'maxSubtotal' }] })
  })

  test('refuses to add rates to an archived zone', async ({ client }) => {
    const user = await createAdminUser('admin')
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.archive(await createZone())

    const response = await client
      .post(`/admin/shipping/${zone.id}/rates`)
      .json(standard)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('updates and deletes a rate', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { zone, rate } = await createRate()

    const updated = await client
      .put(`/admin/shipping/${zone.id}/rates/${rate.id}`)
      .json({ ...standard, price: 99.5, isActive: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    updated.assertStatus(200)
    updated.assertBodyContains({ data: { price: 99.5, isActive: false } })

    const deleted = await client
      .delete(`/admin/shipping/${zone.id}/rates/${rate.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    deleted.assertStatus(204)

    const shippingService = await app.container.make(ShippingService)
    const detail = await shippingService.findDetailOrFail(zone.id)
    assert.lengthOf(detail.rates, 0)
  })

  test('returns 404 for a rate that belongs to another zone', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { rate } = await createRate('Overseas')
    const domestic = await createZone('Domestic', [])

    const response = await client
      .delete(`/admin/shipping/${domestic.id}/rates/${rate.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('rejects a malformed zone id', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { rate } = await createRate()

    const response = await client
      .delete(`/admin/shipping/not-a-uuid/rates/${rate.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('requires the shipping.edit permission', async ({ client }) => {
    const user = await createAdminUser(['shipping.view'])
    const zone = await createZone()

    const response = await client
      .post(`/admin/shipping/${zone.id}/rates`)
      .json(standard)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff shipping: rate conditions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function rateSender(client: ApiClient) {
    const user = await createAdminUser('admin')
    return (zoneId: string, body: Record<string, unknown>) =>
      client
        .post(`/admin/shipping/${zoneId}/rates`)
        .json(body)
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)
  }

  test('saves weight and item limits', async ({ client }) => {
    const postRate = await rateSender(client)
    const zone = await createZone()

    const response = await postRate(zone.id, {
      ...standard,
      name: 'Free light parcels',
      price: 0,
      minWeight: 0.5,
      maxWeight: 2.25,
      minItems: 1,
      maxItems: 10,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      data: { price: 0, minWeight: 0.5, maxWeight: 2.25, minItems: 1, maxItems: 10 },
    })
  })

  test('leaves the weight and item limits empty when omitted', async ({ client }) => {
    const postRate = await rateSender(client)
    const zone = await createZone()

    const response = await postRate(zone.id, standard)

    response.assertStatus(201)
    response.assertBodyContains({
      data: { minWeight: null, maxWeight: null, minItems: null, maxItems: null },
    })
  })

  test('rejects a maximum weight or item count below the minimum', async ({ client }) => {
    const postRate = await rateSender(client)
    const zone = await createZone()

    const weight = await postRate(zone.id, { ...standard, minWeight: 2, maxWeight: 1 })
    weight.assertStatus(422)
    weight.assertBodyContains({ errors: [{ field: 'maxWeight' }] })

    const items = await postRate(zone.id, { ...standard, minItems: 5, maxItems: 2 })
    items.assertStatus(422)
    items.assertBodyContains({ errors: [{ field: 'maxItems' }] })
  })

  test('rejects limits that are not raw numbers in range', async ({ client }) => {
    const postRate = await rateSender(client)
    const zone = await createZone()
    const invalid: [string, unknown][] = [
      ['minWeight', '1'],
      ['maxWeight', -1],
      ['maxWeight', 1.2345],
      ['minItems', 0],
      ['minItems', 1.5],
      ['maxItems', '3'],
      ['maxSubtotal', '100'],
    ]

    for (const [field, value] of invalid) {
      const response = await postRate(zone.id, { ...standard, [field]: value })
      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })
    }
  })

  test('saves subtotal limits per market', async ({ client, assert }) => {
    const postRate = await rateSender(client)
    const marketService = await app.container.make(MarketService)
    await marketService.ensurePrimary({
      name: 'Philippines',
      currencyCode: 'PHP',
      pricesIncludeTax: true,
      countryCodes: ['PH'],
    })
    const us = await marketService.create({
      name: 'United States',
      currencyCode: 'USD',
      pricesIncludeTax: false,
      countryCodes: ['US'],
    })
    const zone = await createZone('Overseas', ['US'])

    const response = await postRate(zone.id, {
      ...standard,
      price: 0,
      marketPrices: [{ marketId: us.id, price: 0, minSubtotal: 50, maxSubtotal: null }],
    })

    response.assertStatus(201)
    assert.deepEqual(response.body().data.marketPrices, [
      { marketId: us.id, price: 0, minSubtotal: 50, maxSubtotal: null },
    ])
  })

  test('rejects a market maximum subtotal below its minimum', async ({ client }) => {
    const postRate = await rateSender(client)
    const marketService = await app.container.make(MarketService)
    const us = await marketService.create({
      name: 'United States',
      currencyCode: 'USD',
      pricesIncludeTax: false,
      countryCodes: ['US'],
    })
    const zone = await createZone('Overseas', ['US'])

    const response = await postRate(zone.id, {
      ...standard,
      marketPrices: [{ marketId: us.id, price: 5, minSubtotal: 100, maxSubtotal: 50 }],
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'marketPrices.0.maxSubtotal' }] })
  })
})
