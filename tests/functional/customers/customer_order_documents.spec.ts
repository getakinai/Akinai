import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import type CustomerAccount from '#models/customer_account'
import type Order from '#models/order'
import { PLACED_ORDERS_SESSION_KEY } from '#services/checkout_service'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

function asCustomer(client: ApiClient, account: CustomerAccount, url: string) {
  return client.get(url).accept('json').withGuard('customer').loginAs(account)
}

async function markPaid(order: Order) {
  await order.merge({ paymentStatus: 'paid', paidAt: DateTime.now() }).save()
}

test.group('Customer account order documents', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('owner downloads the invoice', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await asCustomer(client, account, `/account/orders/${order.id}/invoice`)

    response.assertStatus(200)
    assert.equal(response.header('content-type'), 'application/pdf')
    assert.equal(
      response.header('content-disposition'),
      `attachment; filename="invoice-${order.orderNumber}.pdf"`
    )
    assert.equal(response.header('cache-control'), 'private, no-store')
  })

  test('owner gets the receipt only once the order is paid', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const unpaid = await asCustomer(client, account, `/account/orders/${order.id}/receipt`)
    unpaid.assertStatus(404)

    await markPaid(order)
    const paid = await asCustomer(client, account, `/account/orders/${order.id}/receipt`)
    paid.assertStatus(200)
  })

  test('there is no customer packing slip route', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await asCustomer(client, account, `/account/orders/${order.id}/packing-slip`)

    response.assertStatus(404)
  })

  test('another customer gets 404', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const { account: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)
    await markPaid(order)

    for (const path of ['invoice', 'receipt']) {
      const response = await asCustomer(client, other, `/account/orders/${order.id}/${path}`)
      response.assertStatus(404)
    }
  })

  test('draft orders are 404', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const draft = await createPlacedOrder(customer, { status: 'draft' })

    const response = await asCustomer(client, account, `/account/orders/${draft.id}/invoice`)

    response.assertStatus(404)
  })

  test('guests get 401', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await client.get(`/account/orders/${order.id}/invoice`).accept('json')

    response.assertStatus(401)
  })
})

test.group('Checkout order documents', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a guest downloads the invoice for an order placed in their session', async ({
    client,
    assert,
  }) => {
    const order = await createPlacedOrder(null)

    const response = await client
      .get(`/checkout/orders/${order.id}/invoice`)
      .withSession({ [PLACED_ORDERS_SESSION_KEY]: [order.id] })
      .accept('json')

    response.assertStatus(200)
    assert.equal(response.header('content-type'), 'application/pdf')
  })

  test('a guest gets the receipt only once the order is paid', async ({ client }) => {
    const order = await createPlacedOrder(null)
    const session = { [PLACED_ORDERS_SESSION_KEY]: [order.id] }

    const unpaid = await client
      .get(`/checkout/orders/${order.id}/receipt`)
      .withSession(session)
      .accept('json')
    unpaid.assertStatus(404)

    await markPaid(order)
    const paid = await client
      .get(`/checkout/orders/${order.id}/receipt`)
      .withSession(session)
      .accept('json')
    paid.assertStatus(200)
  })

  test('a guest without the order in their session gets 404', async ({ client }) => {
    const order = await createPlacedOrder(null)
    await markPaid(order)

    for (const path of ['invoice', 'receipt']) {
      const response = await client.get(`/checkout/orders/${order.id}/${path}`).accept('json')
      response.assertStatus(404)
    }
  })

  test('a signed-in owner downloads without a session entry', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer, { placedMinutesAgo: 120 })

    const response = await asCustomer(client, account, `/checkout/orders/${order.id}/invoice`)

    response.assertStatus(200)
  })

  test('another signed-in customer gets 404', async ({ client }) => {
    const { customer } = await createCustomerAccount()
    const { account: other } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const response = await asCustomer(client, other, `/checkout/orders/${order.id}/invoice`)

    response.assertStatus(404)
  })

  test('draft orders are 404 even when in the session', async ({ client }) => {
    const draft = await createPlacedOrder(null, { status: 'draft' })

    const response = await client
      .get(`/checkout/orders/${draft.id}/invoice`)
      .withSession({ [PLACED_ORDERS_SESSION_KEY]: [draft.id] })
      .accept('json')

    response.assertStatus(404)
  })
})
