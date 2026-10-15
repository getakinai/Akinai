import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import CustomerService from '#services/customer_service'
import MarketService from '#services/market_service'
import { createCustomerAccount } from '#tests/helpers/customers'

async function createMarket(name: string, countryCodes: string[]) {
  const marketService = await app.container.make(MarketService)
  return marketService.create({
    name: `${name} ${Date.now()}`,
    currencyCode: 'FJD',
    pricesIncludeTax: true,
    countryCodes,
  })
}

test.group('CustomerService.locationOptions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists active-market countries by name, once each', async ({ assert }) => {
    await createMarket('Fiji', ['FJ'])
    await createMarket('Samoa', ['WS'])
    const archived = await createMarket('Tonga', ['TO'])
    await archived.merge({ isActive: false }).save()
    const service = await app.container.make(CustomerService)

    const { countries, timezones } = await service.locationOptions()
    const codes = countries.map(({ code }) => code)

    assert.includeMembers(codes, ['FJ', 'WS'])
    assert.notInclude(codes, 'TO')
    assert.equal(new Set(codes).size, codes.length)
    const names = countries.map(({ name }) => name)
    assert.deepEqual(
      names,
      [...names].sort((a, b) => a.localeCompare(b))
    )
    assert.include(timezones, 'Pacific/Auckland')
  })
})

test.group('CustomerService.updateLocation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves the location and returns the market covering the country', async ({ assert }) => {
    const market = await createMarket('Fiji', ['FJ'])
    const { account } = await createCustomerAccount({ countryCode: null })
    const service = await app.container.make(CustomerService)

    const result = await service.updateLocation(account, {
      countryCode: 'FJ',
      timezone: 'Pacific/Fiji',
    })

    assert.equal(result.customer.countryCode, 'FJ')
    assert.equal(result.customer.timezone, 'Pacific/Fiji')
    assert.equal(result.customer.marketId, market.id)
    assert.equal(result.market?.id, market.id)
  })
})

test.group('CustomerService.updateOwnProfile: location', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('only switches market when the country changes', async ({ assert }) => {
    const market = await createMarket('Fiji', ['FJ'])
    const { account, customer } = await createCustomerAccount()
    const service = await app.container.make(CustomerService)
    const profile = { fullName: customer.fullName, email: customer.email, phone: null }

    const same = await service.updateOwnProfile(account, {
      ...profile,
      countryCode: 'NZ',
      timezone: 'Pacific/Auckland',
    })
    const changed = await service.updateOwnProfile(account, {
      ...profile,
      countryCode: 'FJ',
      timezone: 'Pacific/Fiji',
    })

    assert.isNull(same.market)
    assert.equal(changed.market?.id, market.id)
    assert.equal(changed.customer.marketId, market.id)
  })

  test('leaves the location alone when it is not sent', async ({ assert }) => {
    const { account, customer } = await createCustomerAccount()
    const service = await app.container.make(CustomerService)

    const { customer: updated } = await service.updateOwnProfile(account, {
      fullName: 'Ana Cruz',
      email: customer.email,
      phone: null,
    })

    assert.equal(updated.countryCode, 'NZ')
    assert.equal(updated.timezone, 'Pacific/Auckland')
  })
})
