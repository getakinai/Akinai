import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import MarketService from '#services/market_service'
import ShippingService from '#services/shipping_service'

const cartOf = (subtotal: number) => ({ subtotal, weight: 0, itemCount: 1, allShipFree: false })

const standard = {
  name: 'Standard',
  price: 150,
  minSubtotal: null,
  maxSubtotal: null,
  isActive: true,
}

test.group('ShippingService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('create normalizes and de-duplicates country codes', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)

    const zone = await shippingService.create({ name: 'Domestic', countryCodes: ['ph', 'PH'] })

    assert.deepEqual(
      zone.countries.map(({ countryCode }) => countryCode),
      ['PH']
    )
    assert.lengthOf(zone.rates, 0)
  })

  test('ensureZone creates the zone with its rates only once', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)

    const first = await shippingService.ensureZone({ name: 'Manila City', countryCodes: ['ph'] }, [
      standard,
    ])
    const second = await shippingService.ensureZone({ name: 'manila city', countryCodes: ['US'] }, [
      standard,
      { ...standard, name: 'Express' },
    ])

    assert.equal(second.id, first.id)
    assert.deepEqual(
      second.countries.map(({ countryCode }) => countryCode),
      ['PH']
    )
    assert.deepEqual(
      second.rates.map(({ name }) => name),
      ['Standard']
    )
  })

  test('update replaces the zone countries', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.create({ name: 'Asia', countryCodes: ['SG', 'MY'] })

    const updated = await shippingService.update(zone, { name: 'Asia', countryCodes: ['JP'] })

    assert.deepEqual(
      updated.countries.map(({ countryCode }) => countryCode),
      ['JP']
    )
  })

  test('ratesFor returns active rates for the country, cheapest first', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.create({ name: 'Domestic', countryCodes: ['PH'] })
    await shippingService.createRate(zone, { ...standard, name: 'Express', price: 300 })
    await shippingService.createRate(zone, standard)
    await shippingService.createRate(zone, { ...standard, name: 'Hidden', isActive: false })

    const rates = await shippingService.ratesFor({ countryCode: 'ph' }, cartOf(500))

    assert.deepEqual(
      rates.map(({ name }) => name),
      ['Standard', 'Express']
    )
  })

  test('ratesFor applies the subtotal bounds inclusively', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.create({ name: 'Domestic', countryCodes: ['PH'] })
    await shippingService.createRate(zone, { ...standard, maxSubtotal: 999.99 })
    await shippingService.createRate(zone, {
      ...standard,
      name: 'Free shipping',
      price: 0,
      minSubtotal: 1000,
    })

    const names = async (subtotal: number) => {
      const rates = await shippingService.ratesFor({ countryCode: 'PH' }, cartOf(subtotal))
      return rates.map(({ name }) => name)
    }

    assert.deepEqual(await names(999.99), ['Standard'])
    assert.deepEqual(await names(1000), ['Free shipping'])
  })

  test('ratesFor ignores archived zones and other countries', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const domestic = await shippingService.create({ name: 'Domestic', countryCodes: ['PH'] })
    const overseas = await shippingService.create({ name: 'Overseas', countryCodes: ['US'] })
    await shippingService.createRate(domestic, standard)
    await shippingService.createRate(overseas, { ...standard, name: 'International' })
    await shippingService.archive(domestic)

    assert.lengthOf(await shippingService.ratesFor({ countryCode: 'PH' }, cartOf(100)), 0)
    assert.lengthOf(await shippingService.ratesFor({ countryCode: 'JP' }, cartOf(100)), 0)
    const usRates = await shippingService.ratesFor({ countryCode: 'US' }, cartOf(100))
    assert.deepEqual(
      usRates.map(({ name }) => name),
      ['International']
    )
  })

  test('ratesFor applies the weight and item limits', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.create({ name: 'Domestic', countryCodes: ['PH'] })
    await shippingService.createRate(zone, standard)
    await shippingService.createRate(zone, {
      ...standard,
      name: 'Free under 2 kg',
      price: 0,
      maxWeight: 2,
    })
    await shippingService.createRate(zone, {
      ...standard,
      name: 'Free for 3+ items',
      price: 0,
      minItems: 3,
    })

    const names = async (weight: number, itemCount: number) => {
      const rates = await shippingService.ratesFor(
        { countryCode: 'PH' },
        { ...cartOf(100), weight, itemCount }
      )
      return rates.map(({ name }) => name).sort()
    }

    assert.deepEqual(await names(2.5, 1), ['Standard'])
    assert.deepEqual(await names(2, 1), ['Free under 2 kg', 'Standard'])
    assert.deepEqual(await names(5, 3), ['Free for 3+ items', 'Standard'])
  })

  test('ratesFor makes the cheapest rate free when every item ships free', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.create({ name: 'Domestic', countryCodes: ['PH'] })
    await shippingService.createRate(zone, standard)
    await shippingService.createRate(zone, { ...standard, name: 'Express', price: 300 })

    const rates = await shippingService.ratesFor(
      { countryCode: 'PH' },
      { ...cartOf(100), allShipFree: true }
    )

    assert.deepEqual(
      rates.map(({ name, price }) => [name, price]),
      [
        ['Standard', 0],
        ['Express', 300],
      ]
    )
    const saved = await shippingService.findDetailOrFail(zone.id)
    assert.sameMembers(
      saved.rates.map(({ price }) => price),
      [150, 300]
    )
  })

  test('ratesFor uses the market price and its own subtotal bounds', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
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
    const zone = await shippingService.create({ name: 'Overseas', countryCodes: ['US'] })
    await shippingService.createRate(zone, {
      ...standard,
      marketPrices: [{ marketId: us.id, price: 8 }],
    })
    await shippingService.createRate(zone, {
      ...standard,
      name: 'Free shipping',
      price: 0,
      minSubtotal: 3000,
      marketPrices: [{ marketId: us.id, price: 0, minSubtotal: 50, maxSubtotal: null }],
    })
    await shippingService.createRate(zone, { ...standard, name: 'Primary only' })

    const offered = async (subtotal: number) => {
      const rates = await shippingService.ratesFor({ countryCode: 'US' }, cartOf(subtotal), us)
      return rates.map(({ name, price, minSubtotal }) => [name, price, minSubtotal])
    }

    assert.deepEqual(await offered(49.99), [['Standard', 8, null]])
    assert.deepEqual(await offered(50), [
      ['Free shipping', 0, 50],
      ['Standard', 8, null],
    ])
  })

  test('findRateForZoneOrFail rejects a rate from another zone', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const domestic = await shippingService.create({ name: 'Domestic', countryCodes: [] })
    const overseas = await shippingService.create({ name: 'Overseas', countryCodes: [] })
    const rate = await shippingService.createRate(overseas, standard)

    await assert.rejects(() => shippingService.findRateForZoneOrFail(domestic.id, rate.id))
  })
})

test.group('ShippingService: regions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  /** A whole-Philippines zone plus Metro Manila and Visayas zones, each with one rate. */
  async function seedPhilippineZones() {
    const shippingService = await app.container.make(ShippingService)
    const country = await shippingService.create({ name: 'Philippines', countryCodes: ['PH'] })
    const manila = await shippingService.create({
      name: 'PH Metro Manila',
      countryCodes: [],
      regionCodes: ['PH-00'],
    })
    const visayas = await shippingService.create({
      name: 'PH Visayas',
      countryCodes: [],
      regionCodes: ['PH-CEB', 'PH-BOH'],
    })
    await shippingService.createRate(country, { ...standard, name: 'Nationwide', price: 300 })
    await shippingService.createRate(manila, { ...standard, name: 'Manila', price: 100 })
    await shippingService.createRate(visayas, { ...standard, name: 'Visayas', price: 200 })
    return { shippingService, country, manila, visayas }
  }

  const rateNames = async (
    shippingService: ShippingService,
    countryCode: string,
    regionCode?: string | null
  ) => {
    const rates = await shippingService.ratesFor({ countryCode, regionCode }, cartOf(100))
    return rates.map(({ name }) => name)
  }

  test('create normalizes regions and stores their country', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)

    const zone = await shippingService.create({
      name: 'PH Visayas',
      countryCodes: [],
      regionCodes: ['ph-ceb', 'PH-CEB', 'PH-boh'],
    })

    assert.deepEqual(
      zone.regions.map(({ countryCode, regionCode }) => [countryCode, regionCode]),
      [
        ['PH', 'PH-BOH'],
        ['PH', 'PH-CEB'],
      ]
    )
  })

  test('update keeps regions when they are left out and replaces them when given', async ({
    assert,
  }) => {
    const shippingService = await app.container.make(ShippingService)
    const zone = await shippingService.create({
      name: 'PH Visayas',
      countryCodes: [],
      regionCodes: ['PH-CEB'],
    })

    const kept = await shippingService.update(zone, { name: 'Visayas', countryCodes: [] })
    assert.deepEqual(
      kept.regions.map(({ regionCode }) => regionCode),
      ['PH-CEB']
    )

    const replaced = await shippingService.update(zone, {
      name: 'Visayas',
      countryCodes: [],
      regionCodes: ['PH-ILI'],
    })
    assert.deepEqual(
      replaced.regions.map(({ regionCode }) => regionCode),
      ['PH-ILI']
    )

    const cleared = await shippingService.update(zone, {
      name: 'Visayas',
      countryCodes: [],
      regionCodes: [],
    })
    assert.lengthOf(cleared.regions, 0)
  })

  test('ratesFor prefers the zone covering the region', async ({ assert }) => {
    const { shippingService } = await seedPhilippineZones()

    assert.deepEqual(await rateNames(shippingService, 'PH', 'PH-00'), ['Manila'])
    assert.deepEqual(await rateNames(shippingService, 'ph', 'ph-ceb'), ['Visayas'])
  })

  test('ratesFor falls back to the whole-country zone', async ({ assert }) => {
    const { shippingService } = await seedPhilippineZones()

    assert.deepEqual(await rateNames(shippingService, 'PH', 'PH-DAS'), ['Nationwide'])
    assert.deepEqual(await rateNames(shippingService, 'PH', null), ['Nationwide'])
    assert.deepEqual(await rateNames(shippingService, 'PH'), ['Nationwide'])
  })

  test('ratesFor falls back when the region zone is archived or has no active rate', async ({
    assert,
  }) => {
    const { shippingService, manila, visayas } = await seedPhilippineZones()
    await shippingService.archive(manila)
    const [visayasRate] = (await shippingService.findDetailOrFail(visayas.id)).rates
    await shippingService.updateRate(visayasRate, { ...standard, name: 'Visayas', isActive: false })

    assert.deepEqual(await rateNames(shippingService, 'PH', 'PH-00'), ['Nationwide'])
    assert.deepEqual(await rateNames(shippingService, 'PH', 'PH-CEB'), ['Nationwide'])
  })

  test('ratesFor offers nothing for an uncovered region without a country zone', async ({
    assert,
  }) => {
    const shippingService = await app.container.make(ShippingService)
    const visayas = await shippingService.create({
      name: 'PH Visayas',
      countryCodes: [],
      regionCodes: ['PH-CEB'],
    })
    await shippingService.createRate(visayas, standard)

    assert.deepEqual(await rateNames(shippingService, 'PH', 'PH-CEB'), ['Standard'])
    assert.deepEqual(await rateNames(shippingService, 'PH', 'PH-00'), [])
  })

  test('shippableCountryCodes includes countries covered only through regions', async ({
    assert,
  }) => {
    const shippingService = await app.container.make(ShippingService)
    const visayas = await shippingService.create({
      name: 'PH Visayas',
      countryCodes: [],
      regionCodes: ['PH-CEB'],
    })

    assert.notInclude(await shippingService.shippableCountryCodes(), 'PH')

    await shippingService.createRate(visayas, standard)
    assert.include(await shippingService.shippableCountryCodes(), 'PH')
  })

  test('listRegions names the zone that owns each region', async ({ assert }) => {
    const { shippingService, manila, visayas } = await seedPhilippineZones()

    const owners = (await shippingService.listRegions()).map(
      ({ regionCode, shippingZoneId, zone }) => [regionCode, shippingZoneId, zone.name]
    )

    assert.includeDeepMembers(owners, [
      ['PH-00', manila.id, 'PH Metro Manila'],
      ['PH-BOH', visayas.id, 'PH Visayas'],
      ['PH-CEB', visayas.id, 'PH Visayas'],
    ])
  })

  test('marketCountryCodes lists the countries of active markets', async ({ assert }) => {
    const shippingService = await app.container.make(ShippingService)
    const marketService = await app.container.make(MarketService)
    const market = await marketService.create({
      name: 'Pacific',
      currencyCode: 'USD',
      pricesIncludeTax: false,
      countryCodes: ['FJ', 'WS'],
    })

    assert.includeMembers(await shippingService.marketCountryCodes(), ['FJ', 'WS'])

    await marketService.archive(market)
    assert.notIncludeMembers(await shippingService.marketCountryCodes(), ['FJ', 'WS'])
  })
})
