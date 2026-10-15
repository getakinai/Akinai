import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import type Market from '#models/market'
import MarketService from '#services/market_service'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount } from '#tests/helpers/customers'

type Body = Record<string, unknown>

function send(client: any, method: 'put', account: CustomerAccount, url: string, body: Body) {
  return client[method](url)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('customer')
    .loginAs(account)
}

let sequence = 0

/** An active market covering the countries (uncommon ones, to avoid clashes). */
async function createMarket(countryCodes: string[]): Promise<Market> {
  const marketService = await app.container.make(MarketService)
  sequence++
  return marketService.create({
    name: `Pacific ${sequence} ${Date.now()}`,
    currencyCode: 'FJD',
    pricesIncludeTax: true,
    countryCodes,
  })
}

test.group('Customer location: welcome gate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sends a customer without a country to the welcome step', async ({ client }) => {
    const { account } = await createCustomerAccount({ countryCode: null })

    const response = await client
      .get('/account')
      .withGuard('customer')
      .loginAs(account)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/account/welcome')
  })

  test('answers JSON account requests with 403 until the country is set', async ({ client }) => {
    const { account } = await createCustomerAccount({ countryCode: null })

    const response = await client
      .get('/account/orders/list')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ code: 'E_PROFILE_INCOMPLETE' }] })
  })

  test('sends a signed-in customer without a country back from checkout', async ({ client }) => {
    const { account } = await createCustomerAccount({ countryCode: null })

    const response = await client
      .get('/checkout')
      .withGuard('customer')
      .loginAs(account)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/account/welcome?return_to=checkout')
  })

  test('still lets them load their profile', async ({ client }) => {
    const { account } = await createCustomerAccount({ countryCode: null })

    const me = await client.get('/account/me').accept('json').withGuard('customer').loginAs(account)

    me.assertStatus(200)
    me.assertBodyContains({ data: { countryCode: null, timezone: null } })
  })

  test('lets customers with a country through', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await client
      .get('/account/orders/list')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
  })

  test('needs a signed-in customer for the welcome step', async ({ client }) => {
    const response = await client.get('/account/location/options').accept('json')

    response.assertStatus(401)
  })
})

test.group('Customer location: options', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists only countries in active markets', async ({ client, assert }) => {
    await createMarket(['FJ'])
    const archived = await createMarket(['TO'])
    await archived.merge({ isActive: false }).save()
    const { account } = await createCustomerAccount({ countryCode: null })

    const response = await client
      .get('/account/location/options')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    response.assertStatus(200)
    const codes = response.body().data.countries.map((country: { code: string }) => country.code)
    assert.include(codes, 'FJ')
    assert.notInclude(codes, 'TO')
    assert.include(response.body().data.timezones, 'Pacific/Fiji')
  })
})

test.group('Customer location: update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves the country and timezone and moves the customer to its market', async ({
    client,
    assert,
  }) => {
    const market = await createMarket(['FJ'])
    const { account, customer } = await createCustomerAccount({ countryCode: null })

    const response = await send(client, 'put', account, '/account/location', {
      countryCode: 'fj',
      timezone: 'Pacific/Fiji',
    })

    response.assertStatus(200)
    response.assertBodyContains({ data: { redirectTo: '/account' } })
    const cookies = ([] as string[]).concat(response.header('set-cookie') ?? [])
    assert.isTrue(cookies.some((cookie) => cookie.startsWith(`hp_market=${market.handle}`)))

    await customer.refresh()
    assert.equal(customer.countryCode, 'FJ')
    assert.equal(customer.timezone, 'Pacific/Fiji')
    assert.equal(customer.marketId, market.id)
  })

  test('returns to checkout when asked', async ({ client }) => {
    await createMarket(['FJ'])
    const { account } = await createCustomerAccount({ countryCode: null })

    const response = await send(client, 'put', account, '/account/location', {
      countryCode: 'FJ',
      timezone: 'Pacific/Fiji',
      returnTo: 'checkout',
    })

    response.assertStatus(200)
    response.assertBodyContains({ data: { redirectTo: '/checkout' } })
  })

  test('rejects countries outside active markets, bad timezones and redirects', async ({
    client,
    assert,
  }) => {
    const archived = await createMarket(['TO'])
    await archived.merge({ isActive: false }).save()
    const { account, customer } = await createCustomerAccount({ countryCode: null })

    const archivedCountry = await send(client, 'put', account, '/account/location', {
      countryCode: 'TO',
      timezone: 'Pacific/Tongatapu',
    })
    const unknownTimezone = await send(client, 'put', account, '/account/location', {
      countryCode: 'TO',
      timezone: 'Mars/Olympus',
    })
    const openRedirect = await send(client, 'put', account, '/account/location', {
      countryCode: 'TO',
      timezone: 'Pacific/Tongatapu',
      returnTo: 'https://evil.example.com',
    })

    archivedCountry.assertStatus(422)
    assert.equal(archivedCountry.body().errors[0].field, 'countryCode')
    unknownTimezone.assertStatus(422)
    assert.includeMembers(
      unknownTimezone.body().errors.map((error: { field: string }) => error.field),
      ['timezone']
    )
    openRedirect.assertStatus(422)
    await customer.refresh()
    assert.isNull(customer.countryCode)
  })

  test('rejects non-string values', async ({ client }) => {
    const { account } = await createCustomerAccount({ countryCode: null })

    const response = await send(client, 'put', account, '/account/location', {
      countryCode: 12,
      timezone: true,
    })

    response.assertStatus(422)
  })
})

test.group('Customer location: account details', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('changing the country moves the customer to its market', async ({ client, assert }) => {
    const market = await createMarket(['FJ'])
    const { account, customer } = await createCustomerAccount()

    const response = await send(client, 'put', account, '/account/details', {
      fullName: customer.fullName,
      email: customer.email,
      phone: null,
      countryCode: 'FJ',
      timezone: 'Pacific/Fiji',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: { countryCode: 'FJ', countryName: 'Fiji', timezone: 'Pacific/Fiji' },
    })
    await customer.refresh()
    assert.equal(customer.marketId, market.id)
  })

  test('keeps a saved country whose market was archived', async ({ client, assert }) => {
    const market = await createMarket(['WS'])
    const { account, customer } = await createCustomerAccount()
    await customer.merge({ countryCode: 'WS' }).save()
    await market.merge({ isActive: false }).save()

    const response = await send(client, 'put', account, '/account/details', {
      fullName: 'Sina',
      email: customer.email,
      phone: null,
      countryCode: 'WS',
      timezone: 'Pacific/Apia',
    })

    response.assertStatus(200)
    await customer.refresh()
    assert.equal(customer.fullName, 'Sina')
    assert.equal(customer.countryCode, 'WS')
  })

  test('the change shows in the activity feed without ids', async ({ client, assert }) => {
    await createMarket(['FJ'])
    const { account } = await createCustomerAccount({ countryCode: null })

    await send(client, 'put', account, '/account/location', {
      countryCode: 'FJ',
      timezone: 'Pacific/Fiji',
    }).then((response: any) => response.assertStatus(200))

    const activity = await client
      .get('/account/activity/list')
      .accept('json')
      .withGuard('customer')
      .loginAs(account)

    activity.assertStatus(200)
    const entry = activity.body().data[0]
    assert.equal(entry.changes.after.countryCode, 'FJ')
    assert.notProperty(entry.changes.after, 'marketId')
  })
})

test.group('Customer location: admin', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('staff can set and clear a customer’s country and timezone', async ({ client, assert }) => {
    const market = await createMarket(['FJ'])
    const user = await createAdminUser(['customers.view', 'customers.edit'])
    const { customer } = await createCustomerAccount({ countryCode: null })
    const body = { fullName: customer.fullName, email: customer.email, phone: null }

    const set = await client
      .put(`/admin/customers/${customer.id}`)
      .json({ ...body, countryCode: 'FJ', timezone: 'Pacific/Fiji' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    set.assertStatus(200)
    set.assertBodyContains({ data: { countryCode: 'FJ', timezone: 'Pacific/Fiji' } })
    const saved = await Customer.findOrFail(customer.id)
    assert.equal(saved.marketId, market.id)

    const cleared = await client
      .put(`/admin/customers/${customer.id}`)
      .json({ ...body, countryCode: null, timezone: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    cleared.assertStatus(200)
    cleared.assertBodyContains({ data: { countryCode: null, timezone: null } })
  })

  test('staff can’t pick a country outside active markets', async ({ client }) => {
    const user = await createAdminUser(['customers.view', 'customers.edit'])
    const { customer } = await createCustomerAccount()

    const response = await client
      .put(`/admin/customers/${customer.id}`)
      .json({
        fullName: customer.fullName,
        email: customer.email,
        phone: null,
        countryCode: 'TV',
        timezone: null,
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('location options need customers.view', async ({ client }) => {
    const allowed = await createAdminUser(['customers.view'])
    const denied = await createAdminUser([])

    const ok = await client
      .get('/admin/customers/location-options')
      .accept('json')
      .withGuard('web')
      .loginAs(allowed)
    const forbidden = await client
      .get('/admin/customers/location-options')
      .accept('json')
      .withGuard('web')
      .loginAs(denied)

    ok.assertStatus(200)
    forbidden.assertStatus(403)
  })
})
