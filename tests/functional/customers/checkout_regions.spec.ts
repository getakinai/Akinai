import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import Order from '#models/order'
import ShippingService from '#services/shipping_service'
import { createOrderProduct, enableBankTransfer, seedOrderSetup } from '#tests/helpers/orders'

const flatRate = { minSubtotal: null, maxSubtotal: null, isActive: true }

let sequence = 0

/**
 * A whole-Philippines zone (300) plus Metro Manila (100) and Visayas (200)
 * zones, and a product to buy.
 */
async function seedPhilippines() {
  const { market } = await seedOrderSetup()
  await enableBankTransfer(market.id)
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
  const nationwide = await shippingService.createRate(country, {
    ...flatRate,
    name: 'Nationwide',
    price: 300,
  })
  const manilaRate = await shippingService.createRate(manila, {
    ...flatRate,
    name: 'Manila',
    price: 100,
  })
  const visayasRate = await shippingService.createRate(visayas, {
    ...flatRate,
    name: 'Visayas',
    price: 200,
  })
  const { variant } = await createOrderProduct('Mug', 50)
  return { variant, nationwide, manilaRate, visayasRate }
}

type Cart = Awaited<ReturnType<typeof seedPhilippines>>

function quoteBody(cart: Cart, address: Record<string, unknown>) {
  return {
    lineItems: [{ variantId: cart.variant.id, quantity: 1 }],
    countryCode: 'PH',
    postalCode: '6000',
    shippingRateId: null,
    ...address,
  }
}

function placeBody(cart: Cart, address: Record<string, unknown>) {
  sequence++
  return {
    ...quoteBody(cart, address),
    email: `ph-guest-${sequence}-${Date.now()}@example.com`,
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    address1: '1 Osmeña Boulevard',
    city: 'Cebu City',
    phone: '+639170000000',
    paymentMethod: 'bank_transfer',
  }
}

test.group('Checkout: shipping by province', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))
  group.each.timeout(20_000)

  async function quotedRates(client: ApiClient, cart: Cart, address: Record<string, unknown>) {
    const response = await client
      .post('/checkout/quote')
      .json(quoteBody(cart, address))
      .accept('json')
      .withCsrfToken()
    response.assertStatus(200)
    return response.body().data.shippingRates.map(({ name }: { name: string }) => name)
  }

  test('quotes the rates of the zone covering the province', async ({ client, assert }) => {
    const cart = await seedPhilippines()

    assert.deepEqual(await quotedRates(client, cart, { regionCode: 'PH-CEB' }), ['Visayas'])
    assert.deepEqual(await quotedRates(client, cart, { regionCode: 'PH-00' }), ['Manila'])
  })

  test('matches the province by name when no code is sent', async ({ client, assert }) => {
    const cart = await seedPhilippines()

    assert.deepEqual(await quotedRates(client, cart, { province: 'Metro Manila' }), ['Manila'])
    assert.deepEqual(await quotedRates(client, cart, { province: 'bohol province' }), ['Visayas'])
  })

  test('falls back to the whole-country zone', async ({ client, assert }) => {
    const cart = await seedPhilippines()

    assert.deepEqual(await quotedRates(client, cart, { regionCode: 'PH-DAS' }), ['Nationwide'])
    assert.deepEqual(await quotedRates(client, cart, {}), ['Nationwide'])
  })

  test('rejects a region code that is not in the province list', async ({ client }) => {
    const cart = await seedPhilippines()

    for (const regionCode of ['PH-XXX', 12]) {
      const response = await client
        .post('/checkout/quote')
        .json(quoteBody(cart, { regionCode }))
        .accept('json')
        .withCsrfToken()
      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'regionCode' }] })
    }
  })

  test('a region code from another country does not change its rates', async ({
    client,
    assert,
  }) => {
    const cart = await seedPhilippines()

    const response = await client
      .post('/checkout/quote')
      .json({ ...quoteBody(cart, { regionCode: 'PH-00' }), countryCode: 'AU', province: 'NSW' })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.shippingRates.map(({ name }: { name: string }) => name),
      ['Standard']
    )
  })

  test('places the order with the province zone rate and catalog name', async ({
    client,
    assert,
  }) => {
    const cart = await seedPhilippines()
    const body = placeBody(cart, {
      province: 'cebu typo',
      regionCode: 'PH-CEB',
      shippingRateId: cart.visayasRate.id,
    })

    const response = await client.post('/checkout').json(body).accept('json').withCsrfToken()

    response.assertStatus(201)
    const order = await Order.query().where('email', body.email).firstOrFail()
    assert.equal(order.shippingRateId, cart.visayasRate.id)
    assert.equal(Number(order.shippingPrice), 200)
    assert.equal(order.shippingAddress?.province, 'Cebu')
    assert.equal(order.shippingAddress?.regionCode, 'PH-CEB')
  })

  test('refuses another zone’s rate for the province', async ({ client }) => {
    const cart = await seedPhilippines()

    const response = await client
      .post('/checkout')
      .json(
        placeBody(cart, {
          province: 'Cebu',
          regionCode: 'PH-CEB',
          shippingRateId: cart.manilaRate.id,
        })
      )
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'shippingRateId' }] })
  })

  test('requires a listed province for Philippine orders', async ({ client }) => {
    const cart = await seedPhilippines()

    const response = await client
      .post('/checkout')
      .json(
        placeBody(cart, {
          province: 'Atlantis',
          shippingRateId: cart.nationwide.id,
        })
      )
      .accept('json')
      .withCsrfToken()

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'province', message: 'Choose a province' }],
    })
  })
})
