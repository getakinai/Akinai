import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import Market from '#models/market'
import MarketService from '#services/market_service'

const philippines = {
  name: 'Philippines',
  currencyCode: 'php',
  pricesIncludeTax: true,
  countryCodes: ['ph'],
}

test.group('MarketService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('ensurePrimary creates the primary market only once', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)

    const first = await marketService.ensurePrimary(philippines)
    const second = await marketService.ensurePrimary({ ...philippines, name: 'Other' })

    assert.equal(first.id, second.id)
    assert.isTrue(first.isPrimary)
    assert.equal(first.currencyCode, 'PHP')
    assert.lengthOf(await Market.query().where('is_primary', true), 1)
  })

  test('create normalizes currency and country codes and derives a handle', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)

    const market = await marketService.create({
      name: 'South East Asia',
      currencyCode: 'usd',
      pricesIncludeTax: false,
      countryCodes: ['sg', 'my', 'SG'],
    })

    assert.equal(market.handle, 'south-east-asia')
    assert.equal(market.currencyCode, 'USD')
    assert.isFalse(market.isPrimary)
    assert.sameMembers(
      market.countries.map(({ countryCode }) => countryCode),
      ['SG', 'MY']
    )
  })

  test('create adds a suffix when the handle is taken', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)
    await marketService.create({ ...philippines, name: 'Europe', countryCodes: [] })

    const second = await marketService.create({ ...philippines, name: 'Europe!', countryCodes: [] })

    assert.equal(second.handle, 'europe-2')
  })

  test('update replaces the countries of the market', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)
    const market = await marketService.create({
      ...philippines,
      name: 'Oceania',
      countryCodes: ['NZ', 'AU'],
    })

    const updated = await marketService.update(market, {
      name: 'Oceania',
      handle: 'oceania',
      currencyCode: 'nzd',
      pricesIncludeTax: true,
      countryCodes: ['NZ', 'FJ'],
    })

    assert.equal(updated.currencyCode, 'NZD')
    assert.sameMembers(
      updated.countries.map(({ countryCode }) => countryCode),
      ['NZ', 'FJ']
    )
  })

  test('findForCountry returns the active market covering the country', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)
    await marketService.ensurePrimary(philippines)
    const oceania = await marketService.create({
      ...philippines,
      name: 'Oceania',
      currencyCode: 'NZD',
      countryCodes: ['NZ'],
    })

    const found = await marketService.findForCountry('nz')

    assert.equal(found?.id, oceania.id)
  })

  test('findForCountry falls back to the primary market', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)
    const primary = await marketService.ensurePrimary(philippines)
    const oceania = await marketService.create({
      ...philippines,
      name: 'Oceania',
      currencyCode: 'NZD',
      countryCodes: ['NZ'],
    })
    await marketService.archive(oceania)

    const archivedCountry = await marketService.findForCountry('NZ')
    const uncoveredCountry = await marketService.findForCountry('US')
    assert.equal(archivedCountry?.id, primary.id)
    assert.equal(uncoveredCountry?.id, primary.id)
  })

  test('findForCountry returns null when there is no primary market', async ({ assert }) => {
    const marketService = await app.container.make(MarketService)

    assert.isNull(await marketService.findForCountry('US'))
  })
})
