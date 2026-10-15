import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import type Order from '#models/order'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount, createPlacedOrder } from '#tests/helpers/customers'

function download(client: ApiClient, user: User, url: string) {
  return client.get(url).accept('json').withGuard('web').loginAs(user)
}

async function placedOrder(options: Parameters<typeof createPlacedOrder>[1] = {}) {
  const { customer } = await createCustomerAccount()
  return createPlacedOrder(customer, options)
}

async function markPaid(order: Order) {
  await order.merge({ paymentStatus: 'paid', paidAt: DateTime.now() }).save()
}

test.group('Staff order documents', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('downloads the invoice as a private PDF', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view'])
    const order = await placedOrder()

    const response = await download(client, user, `/admin/orders/${order.id}/invoice`)

    response.assertStatus(200)
    assert.equal(response.header('content-type'), 'application/pdf')
    assert.equal(
      response.header('content-disposition'),
      `attachment; filename="invoice-${order.orderNumber}.pdf"`
    )
    assert.equal(response.header('cache-control'), 'private, no-store')
    assert.equal(response.header('x-content-type-options'), 'nosniff')
    assert.isAbove(Number(response.header('content-length')), 1000)
  })

  test('downloads the packing slip', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view'])
    const order = await placedOrder()

    const response = await download(client, user, `/admin/orders/${order.id}/packing-slip`)

    response.assertStatus(200)
    assert.equal(response.header('content-type'), 'application/pdf')
    assert.include(response.header('content-disposition'), `packing-slip-${order.orderNumber}.pdf`)
  })

  test('the receipt is 404 until the order is paid', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view'])
    const order = await placedOrder()

    const unpaid = await download(client, user, `/admin/orders/${order.id}/receipt`)
    unpaid.assertStatus(404)

    await markPaid(order)
    const paid = await download(client, user, `/admin/orders/${order.id}/receipt`)
    paid.assertStatus(200)
    assert.include(paid.header('content-disposition'), `receipt-${order.orderNumber}.pdf`)
  })

  test('the receipt is still available after a full refund', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    const order = await placedOrder()
    await order.merge({ paymentStatus: 'refunded', refundedTotal: order.total }).save()

    const response = await download(client, user, `/admin/orders/${order.id}/receipt`)

    response.assertStatus(200)
  })

  test('cancelled orders still have an invoice', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    const order = await placedOrder({ status: 'cancelled' })

    const response = await download(client, user, `/admin/orders/${order.id}/invoice`)

    response.assertStatus(200)
  })

  test('draft orders have no documents', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])
    const draft = await placedOrder({ status: 'draft' })

    for (const path of ['invoice', 'receipt', 'packing-slip']) {
      const response = await download(client, user, `/admin/orders/${draft.id}/${path}`)
      response.assertStatus(404)
    }
  })

  test('unknown orders are 404', async ({ client }) => {
    const user = await createAdminUser(['orders.view'])

    const response = await download(
      client,
      user,
      '/admin/orders/01a11382-716f-7774-83b7-09aa5f030a10/invoice'
    )

    response.assertStatus(404)
  })

  test('staff without orders.view get 403', async ({ client }) => {
    const user = await createAdminUser(['customers.view'])
    const order = await placedOrder()

    for (const path of ['invoice', 'receipt', 'packing-slip']) {
      const response = await download(client, user, `/admin/orders/${order.id}/${path}`)
      response.assertStatus(403)
    }
  })

  test('customers and guests cannot reach the staff routes', async ({ client }) => {
    const { account, customer } = await createCustomerAccount()
    const order = await createPlacedOrder(customer)

    const asCustomer = await client
      .get(`/admin/orders/${order.id}/invoice`)
      .accept('json')
      .withGuard('customer')
      .loginAs(account)
    const asGuest = await client.get(`/admin/orders/${order.id}/invoice`).accept('json')

    asCustomer.assertStatus(401)
    asGuest.assertStatus(401)
  })
})
