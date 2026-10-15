import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import TaxService from '#services/tax_service'

const vat = {
  name: 'VAT',
  countryCode: 'PH',
  regionCode: null,
  rate: 12,
  appliesToShipping: false,
}

test.group('TaxService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('create uppercases country and region codes', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)

    const taxRate = await taxService.create({ ...vat, countryCode: 'ca', regionCode: 'on' })

    assert.equal(taxRate.countryCode, 'CA')
    assert.equal(taxRate.regionCode, 'ON')
    assert.isTrue(taxRate.isActive)
  })

  test('create stores an empty region as country-wide', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)

    const taxRate = await taxService.create({ ...vat, regionCode: '' })

    assert.isNull(taxRate.regionCode)
  })

  test('resolve prefers the region rate over the country rate', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)
    await taxService.create({ ...vat, countryCode: 'CA', rate: 5 })
    const ontario = await taxService.create({
      ...vat,
      name: 'HST',
      countryCode: 'CA',
      regionCode: 'ON',
      rate: 13,
    })

    const resolved = await taxService.resolve('ca', 'on')

    assert.equal(resolved?.id, ontario.id)
    assert.equal(resolved?.rate, 13)
  })

  test('resolve falls back to the country rate', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)
    const country = await taxService.create({ ...vat, countryCode: 'CA', rate: 5 })

    const forRegion = await taxService.resolve('CA', 'BC')
    const forCountry = await taxService.resolve('CA')
    assert.equal(forRegion?.id, country.id)
    assert.equal(forCountry?.id, country.id)
  })

  test('resolve ignores archived rates', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)
    const country = await taxService.create(vat)
    const region = await taxService.create({ ...vat, regionCode: 'NCR', rate: 10 })
    await taxService.archive(region)

    const resolved = await taxService.resolve('PH', 'NCR')
    assert.equal(resolved?.id, country.id)

    await taxService.archive(country)
    assert.isNull(await taxService.resolve('PH', 'NCR'))
  })

  test('ensureRate creates the rate only once', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)

    const first = await taxService.ensureRate({ ...vat, countryCode: 'nz', rate: 15 })
    const second = await taxService.ensureRate({ ...vat, countryCode: 'NZ', rate: 10 })

    assert.equal(second.id, first.id)
    assert.equal(second.rate, 15)
  })

  test('ensureRate keeps an archived rate instead of adding another', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)
    const archived = await taxService.archive(await taxService.create(vat))

    const ensured = await taxService.ensureRate(vat)

    assert.equal(ensured.id, archived.id)
    assert.isFalse(ensured.isActive)
  })

  test('resolve returns null for a country without rates', async ({ assert }) => {
    const taxService = await app.container.make(TaxService)

    assert.isNull(await taxService.resolve('US'))
  })
})
