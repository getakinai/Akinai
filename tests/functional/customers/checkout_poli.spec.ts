import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Order from '#models/order'
import { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'
import { createOrderProduct, seedOrderSetup } from '#tests/helpers/orders'
import {
  POLI_NAVIGATE_URL,
  POLI_TOKEN,
  enablePoli,
  fakePoliGateway,
  type FakePoliGateway,
} from '#tests/helpers/poli'

let gateway: FakePoliGateway

async function placePoliOrder(client: any) {
  const { market, rate } = await seedOrderSetup()
  await enablePoli([market.id])
  const { variant } = await createOrderProduct('Mug', 20)

  const response = await client
    .post('/checkout')
    .json({
      lineItems: [{ variantId: variant.id, quantity: 1 }],
      countryCode: 'AU',
      province: 'NSW',
      postalCode: '2000',
      shippingRateId: rate.id,
      email: `guest-${Date.now()}@example.com`,
      firstName: 'Jane',
      lastName: 'Buyer',
      address1: '1 George Street',
      city: 'Sydney',
      phone: '+61400000000',
      paymentMethod: 'poli',
    })
    .accept('json')
    .withCsrfToken()
  const order = await Order.query().where('payment_reference', POLI_TOKEN).first()
  return { response, order }
}

test.group('Checkout: POLi', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    const fake = fakePoliGateway()
    gateway = fake.gateway
    return fake.restore
  })
  group.each.timeout(30_000)

  test('placing an order sends the shopper to POLi', async ({ client, assert }) => {
    const { response, order } = await placePoliOrder(client)

    response.assertStatus(201)
    assert.equal(response.body().data.redirectTo, POLI_NAVIGATE_URL)
    assert.isNotNull(order)
    assert.isTrue(order!.isPendingCheckout)
    assert.equal(order!.paymentMethod, 'poli')
    assert.isNull(order!.orderNumber)
    assert.equal(gateway.initiated[0].orderId, order!.id)
  })

  test('POLi is listed at checkout once set up', async ({ client, assert }) => {
    const { market } = await seedOrderSetup()
    await enablePoli([market.id])

    const response = await client.get('/checkout/payment-methods').accept('json')

    response.assertStatus(200)
    assert.deepInclude(
      response.body().data.map((method: { code: string; name: string }) => ({
        code: method.code,
        name: method.name,
      })),
      { code: 'poli', name: 'POLi (online banking)' }
    )
  })

  test('returning from POLi places the paid order', async ({ client, assert }) => {
    const { order } = await placePoliOrder(client)
    gateway.paid(order!)

    const response = await client
      .get(`/checkout/orders/${order!.id}/poli-return`)
      .qs({ status: 'success', token: POLI_TOKEN })
      .withSession({ [PLACED_ORDERS_SESSION_KEY]: [order!.id] })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/checkout/thank-you/${order!.id}`)
    await order!.refresh()
    assert.equal(order!.status, 'open')
    assert.equal(order!.paymentStatus, 'paid')
    assert.isNotNull(order!.orderNumber)
  })

  test('a cancelled payment goes back to checkout', async ({ client, assert }) => {
    const { order } = await placePoliOrder(client)
    gateway.paid(order!, { status: 'Cancelled', paid: false })

    const response = await client
      .get(`/checkout/orders/${order!.id}/poli-return`)
      .qs({ status: 'cancelled', token: POLI_TOKEN })
      .withSession({ [PLACED_ORDERS_SESSION_KEY]: [order!.id] })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/checkout')
    await order!.refresh()
    assert.isTrue(order!.isPendingCheckout)
  })

  test('another session cannot settle the order', async ({ client, assert }) => {
    const { order } = await placePoliOrder(client)
    gateway.paid(order!)
    const { account } = await createCustomerAccount()

    const guest = await client
      .get(`/checkout/orders/${order!.id}/poli-return`)
      .qs({ status: 'success', token: POLI_TOKEN })
      .redirects(0)
    const otherCustomer = await client
      .get(`/checkout/orders/${order!.id}/poli-return`)
      .qs({ status: 'success', token: POLI_TOKEN })
      .withGuard('customer')
      .loginAs(account)
      .redirects(0)

    guest.assertStatus(302)
    otherCustomer.assertStatus(302)
    assert.lengthOf(gateway.lookups, 0)
    await order!.refresh()
    assert.isTrue(order!.isPendingCheckout)
  })

  test('rejects a malformed token', async ({ client }) => {
    const { order } = await placePoliOrder(client)

    const response = await client
      .get(`/checkout/orders/${order!.id}/poli-return`)
      .qs({ status: 'success', token: '<script>' })
      .withSession({ [PLACED_ORDERS_SESSION_KEY]: [order!.id] })
      .accept('json')
      .redirects(0)

    response.assertStatus(422)
  })

  test('POLi’s nudge places the paid order', async ({ client, assert }) => {
    const { order } = await placePoliOrder(client)
    gateway.paid(order!)

    const response = await client.post('/poli/nudge').form({ Token: POLI_TOKEN }).accept('json')

    response.assertStatus(200)
    response.assertBodyContains({ data: { received: true } })
    await order!.refresh()
    assert.equal(order!.paymentStatus, 'paid')
    assert.equal(order!.status, 'open')
  })

  test('a nudge with an unknown token still answers 200', async ({ client, assert }) => {
    const { order } = await placePoliOrder(client)

    const response = await client.post('/poli/nudge').form({ Token: 'UnknownToken' }).accept('json')

    response.assertStatus(200)
    await order!.refresh()
    assert.isTrue(order!.isPendingCheckout)
  })

  test('a nudge without a token is rejected', async ({ client }) => {
    const response = await client.post('/poli/nudge').form({}).accept('json')

    response.assertStatus(422)
  })

  test('pay again opens POLi for an unpaid order', async ({ client, assert }) => {
    await seedOrderSetup()
    const order = await createPlacedOrder(null, { paymentMethod: 'poli' })

    const response = await client
      .post(`/checkout/orders/${order.id}/payment`)
      .withSession({ [PLACED_ORDERS_SESSION_KEY]: [order.id] })
      .accept('json')
      .withCsrfToken()

    response.assertStatus(201)
    assert.equal(response.body().data.redirectTo, POLI_NAVIGATE_URL)
    await order.refresh()
    assert.equal(order.paymentReference, POLI_TOKEN)
  })

  test('pay again is not found for another session', async ({ client }) => {
    await seedOrderSetup()
    const order = await createPlacedOrder(null, { paymentMethod: 'poli' })

    const response = await client
      .post(`/checkout/orders/${order.id}/payment`)
      .accept('json')
      .withCsrfToken()

    response.assertStatus(404)
  })
})
